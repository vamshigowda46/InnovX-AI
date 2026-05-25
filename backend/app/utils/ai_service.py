"""
InnovX AI — Gemini integration with timeouts, safe parsing, and fallbacks.
"""
import os
import json
import re
import logging
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

_model = None
_active_model_name = None
_gemini_ready = False
_executor = ThreadPoolExecutor(max_workers=4)
GEMINI_TIMEOUT_SECONDS = int(os.getenv('GEMINI_TIMEOUT_SECONDS', '45'))


def _get_api_key():
    return (os.getenv('GEMINI_API_KEY') or '').strip()


def init_gemini(app_config=None):
    """Initialize Gemini from env or Flask config."""
    global _model, _active_model_name, _gemini_ready
    api_key = _get_api_key()
    if app_config and getattr(app_config, 'GEMINI_API_KEY', None):
        api_key = (app_config.GEMINI_API_KEY or '').strip() or api_key

    if not api_key:
        logger.warning('GEMINI_API_KEY not set — AI features use smart fallbacks')
        _gemini_ready = False
        return False

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)

        model_candidates = [
            'gemini-2.0-flash',
            'gemini-1.5-flash-latest',
            'gemini-1.5-flash',
            'gemini-1.5-pro-latest',
            'gemini-1.5-pro',
            'gemini-pro',
        ]

        for model_name in model_candidates:
            try:
                test_model = genai.GenerativeModel(
                    model_name,
                    generation_config={
                        'temperature': 0.7,
                        'max_output_tokens': 4096,
                    },
                )
                _model = test_model
                _active_model_name = model_name
                _gemini_ready = True
                logger.info('Gemini ready: model=%s', model_name)
                return True
            except Exception as err:
                logger.debug('Model %s unavailable: %s', model_name, err)
                continue

        logger.warning('No Gemini model available — using fallbacks')
        _gemini_ready = False
        return False
    except ImportError:
        logger.error('google-generativeai not installed. Run: pip install google-generativeai')
        _gemini_ready = False
        return False
    except Exception as e:
        logger.error('Gemini init error: %s', e)
        _gemini_ready = False
        return False


def get_ai_status():
    return {
        'configured': bool(_get_api_key()),
        'ready': _gemini_ready,
        'model': _active_model_name,
        'timeout_seconds': GEMINI_TIMEOUT_SECONDS,
    }


def _get_model():
    global _model
    if _model is None:
        init_gemini()
    return _model


def _extract_response_text(response):
    """Safely extract text from Gemini response (handles blocked / empty)."""
    if not response:
        return None
    try:
        if hasattr(response, 'text') and response.text:
            return response.text.strip()
    except Exception as e:
        logger.debug('response.text failed: %s', e)

    try:
        candidates = getattr(response, 'candidates', None) or []
        for cand in candidates:
            content = getattr(cand, 'content', None)
            if not content:
                continue
            parts = getattr(content, 'parts', None) or []
            texts = []
            for part in parts:
                t = getattr(part, 'text', None)
                if t:
                    texts.append(t)
            if texts:
                return '\n'.join(texts).strip()
    except Exception as e:
        logger.debug('candidate parse failed: %s', e)

    return None


def _parse_json(text):
    if not text:
        return None
    text = text.strip()
    text = re.sub(r'^```(?:json)?\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'\s*```$', '', text, flags=re.MULTILINE)
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        for pattern in [r'(\[[\s\S]*\])', r'(\{[\s\S]*\})']:
            match = re.search(pattern, text)
            if match:
                try:
                    return json.loads(match.group(1))
                except Exception:
                    continue
    return None


def _generate_sync(prompt):
    model = _get_model()
    if not model:
        raise RuntimeError('Gemini model not initialized')
    try:
        response = model.generate_content(
            prompt,
            request_options={'timeout': GEMINI_TIMEOUT_SECONDS},
        )
    except TypeError:
        response = model.generate_content(prompt)
    text = _extract_response_text(response)
    if not text:
        raise ValueError('Empty Gemini response')
    return text


def _call_gemini(prompt, fallback, expect_type='auto'):
    """
    Call Gemini with timeout; return fallback on any failure.
    expect_type: 'array', 'object', or 'auto'
    """
    if not _get_api_key():
        logger.info('Gemini skipped (no API key) — fallback used')
        result = fallback
        if isinstance(result, dict):
            result = {**result, '_meta': {'source': 'fallback', 'reason': 'no_api_key'}}
        return result

    model = _get_model()
    if not model:
        init_gemini()
        model = _get_model()
    if not model:
        return fallback

    try:
        future = _executor.submit(_generate_sync, prompt)
        raw_text = future.result(timeout=GEMINI_TIMEOUT_SECONDS + 5)
        logger.info('Gemini response received (%d chars)', len(raw_text))
        parsed = _parse_json(raw_text)
        if parsed is None:
            logger.warning('Gemini JSON parse failed, using fallback. Preview: %s', raw_text[:200])
            return fallback

        if expect_type == 'array' and not isinstance(parsed, list):
            logger.warning('Expected array, got %s — fallback', type(parsed).__name__)
            return fallback
        if expect_type == 'object' and not isinstance(parsed, dict):
            logger.warning('Expected object, got %s — fallback', type(parsed).__name__)
            return fallback

        if isinstance(parsed, dict):
            parsed['_meta'] = {'source': 'gemini', 'model': _active_model_name}
        return parsed

    except FuturesTimeoutError:
        logger.error('Gemini call timed out after %ss', GEMINI_TIMEOUT_SECONDS)
        return fallback
    except Exception as e:
        err_str = str(e)
        if '429' in err_str or 'quota' in err_str.lower():
            logger.warning('Gemini rate limit — using fallback. Check API quota at https://ai.google.dev')
        else:
            logger.error('Gemini call error: %s', e)
        return fallback


# ─── Public AI functions ─────────────────────────────────────────────────────

def generate_project_ideas(domain, difficulty, tech_stack):
    tech_str = ', '.join(tech_stack) if isinstance(tech_stack, list) else str(tech_stack)
    prompt = f"""Generate 3 innovative student project ideas.

Domain: {domain}
Difficulty: {difficulty}
Tech Stack: {tech_str or 'any'}

Return ONLY a valid JSON array (no markdown). Each object:
"title", "description", "features" (5 strings), "architecture", "roadmap" (4 objects with title, duration), "estimated_time"."""

    fallback = [
        {
            "title": f"AI-Powered {domain} Platform",
            "description": f"A smart {domain} platform using ML for personalized recommendations and automation.",
            "features": ["Auth & profiles", "AI recommendations", "Real-time collab", "Analytics", "Responsive UI"],
            "architecture": f"React + Flask + MySQL + {tech_str or 'Python'}",
            "roadmap": [
                {"title": "Planning", "duration": "1 week"},
                {"title": "Core build", "duration": "3 weeks"},
                {"title": "AI layer", "duration": "2 weeks"},
                {"title": "Launch", "duration": "1 week"},
            ],
            "estimated_time": "7 weeks",
        },
        {
            "title": f"Smart {domain} Tracker",
            "description": f"Tracking and collaboration system for {domain} teams with live updates.",
            "features": ["WebSockets", "Team tools", "Milestones", "Notifications", "Reports"],
            "architecture": "React + Flask + MySQL + Redis",
            "roadmap": [
                {"title": "MVP", "duration": "2 weeks"},
                {"title": "Features", "duration": "4 weeks"},
                {"title": "Beta", "duration": "1 week"},
                {"title": "Deploy", "duration": "1 week"},
            ],
            "estimated_time": "8 weeks",
        },
        {
            "title": f"{domain} Community Hub",
            "description": f"Community platform for {domain} innovators to share and grow.",
            "features": ["Forums", "Showcase", "Mentorship", "Resources", "Events"],
            "architecture": "React + Flask + PostgreSQL",
            "roadmap": [
                {"title": "Foundation", "duration": "2 weeks"},
                {"title": "Community", "duration": "3 weeks"},
                {"title": "Discovery", "duration": "2 weeks"},
                {"title": "Launch", "duration": "1 week"},
            ],
            "estimated_time": "8 weeks",
        },
    ]
    return _call_gemini(prompt, fallback, expect_type='array')


def analyze_skills(skills, projects, interests):
    skills_str = ', '.join(skills) if isinstance(skills, list) else str(skills)
    interests_str = ', '.join(interests) if isinstance(interests, list) else str(interests)
    prompt = f"""Analyze student profile. Return ONLY JSON:
skills: {skills_str}, projects: {projects}, interests: {interests_str}
Keys: strengths (3), skill_gaps (4), internship_recommendations (3 objects type+companies), hackathon_recommendations (3), improvement_plan (5), career_paths (3), trust_score (0-100)."""

    fallback = {
        "strengths": skills[:3] if isinstance(skills, list) and skills else ["Problem solving", "Collaboration", "Technical curiosity"],
        "skill_gaps": ["Cloud (AWS/GCP)", "System Design", "DevOps", "DSA practice"],
        "internship_recommendations": [
            {"type": "Software Engineering", "companies": ["Google", "Microsoft", "Amazon"]},
            {"type": "Full Stack", "companies": ["Startups", "Product companies"]},
            {"type": "Data/ML", "companies": ["Netflix", "Uber", "Spotify"]},
        ],
        "hackathon_recommendations": ["MLH Hackathons", "Devfolio", "Smart India Hackathon"],
        "improvement_plan": [
            "Ship 2 deployed full-stack projects",
            "Cloud certification",
            "100 LeetCode mediums",
            "2 open-source PRs",
            "Technical blog (5 posts)",
        ],
        "career_paths": ["Full Stack Developer", "ML Engineer", "Product Engineer"],
        "trust_score": 65,
    }
    return _call_gemini(prompt, fallback, expect_type='object')


def generate_resume_content(user_data):
    prompt = f"""Generate resume JSON for: {json.dumps(user_data)}
Keys: summary, objective, skills_description, project_descriptions (2 strings), cover_letter_intro. ONLY JSON."""

    skills = user_data.get('skills', [])
    skills_str = ', '.join(skills[:5]) if skills else 'software development'
    dept = user_data.get('department', 'Computer Science')
    fallback = {
        "summary": f"Motivated {dept} student skilled in {skills_str}. Delivers scalable solutions with strong engineering fundamentals.",
        "objective": f"Seeking roles to apply {dept} expertise and grow as a software professional.",
        "skills_description": f"Technical: {skills_str}. Soft: collaboration, agile, communication.",
        "project_descriptions": [
            "Built full-stack app improving engagement 40% with 99.9% uptime.",
            "AI tool reducing manual work 60% with 95% accuracy.",
        ],
        "cover_letter_intro": f"Passionate {dept} professional ready to contribute with {skills_str}.",
    }
    result = _call_gemini(prompt, fallback, expect_type='object')
    if isinstance(result, dict) and '_meta' in result:
        result = {k: v for k, v in result.items() if k != '_meta'}
    return result


def generate_learning_roadmap(career_goal, current_skills, timeline_months):
    skills_str = ', '.join(current_skills) if isinstance(current_skills, list) else str(current_skills)
    prompt = f"""Learning roadmap JSON. Goal: {career_goal}, Skills: {skills_str}, Months: {timeline_months}
Keys: phases (title, duration_weeks, skills_to_learn, resources, milestones), total_skills, recommended_projects (3), certifications."""

    weeks = timeline_months * 4
    pw = max(weeks // 3, 2)
    fallback = {
        "phases": [
            {"title": "Foundation", "duration_weeks": pw, "skills_to_learn": ["Core concepts", "Git"], "resources": ["freeCodeCamp"], "milestones": ["3 beginner projects"]},
            {"title": "Intermediate", "duration_weeks": pw, "skills_to_learn": ["Frameworks", "APIs", "DB"], "resources": ["Docs", "Udemy"], "milestones": ["Full-stack project"]},
            {"title": "Advanced", "duration_weeks": weeks - 2 * pw, "skills_to_learn": ["System design", "Best practices"], "resources": ["Blogs", "OSS"], "milestones": ["Portfolio", "Apply"]},
        ],
        "total_skills": ["Git", "Problem Solving", career_goal.split()[0] if career_goal else "Core"],
        "recommended_projects": [f"Portfolio for {career_goal}", "CRUD + auth app", f"AI project for {career_goal}"],
        "certifications": ["AWS Cloud Practitioner", "Google Cloud Associate"],
    }
    result = _call_gemini(prompt, fallback, expect_type='object')
    if isinstance(result, dict) and '_meta' in result:
        result = {k: v for k, v in result.items() if k != '_meta'}
    return result


def detect_fake_profile(user_data):
    score = 40
    recommendations = []
    if user_data.get('github_url'):
        score += 20
    else:
        recommendations.append('Add GitHub URL')
    if user_data.get('linkedin_url'):
        score += 10
    else:
        recommendations.append('Add LinkedIn URL')
    if user_data.get('bio', '') and len(user_data.get('bio', '')) > 50:
        score += 10
    else:
        recommendations.append('Write a detailed bio')
    if user_data.get('projects_count', 0) > 0:
        score += 15
    else:
        recommendations.append('Add at least one project')
    skills = user_data.get('skills', [])
    if isinstance(skills, list) and len(skills) >= 3:
        score += 5
    else:
        recommendations.append('Add 3+ skills')
    score = min(score, 100)
    return {
        'trust_score': score,
        'risk_level': 'low' if score >= 70 else 'medium' if score >= 40 else 'high',
        'flags': [],
        'recommendations': recommendations,
    }


def generate_team_match_score(user1_skills, user2_skills, user1_interests, user2_interests):
    try:
        s1 = set(s.lower() for s in (user1_skills or []))
        s2 = set(s.lower() for s in (user2_skills or []))
        i1 = set(i.lower() for i in (user1_interests or []))
        i2 = set(i.lower() for i in (user2_interests or []))
        skill_union = len(s1.union(s2))
        skill_diff = len(s1.symmetric_difference(s2))
        complement = (skill_diff / skill_union * 60) if skill_union > 0 else 30
        iu = len(i1.union(i2))
        overlap = len(i1.intersection(i2))
        interest = (overlap / iu * 40) if iu > 0 else 20
        return max(min(int(complement + interest), 99), 15)
    except Exception:
        return 70


def predict_startup_success(startup_data):
    stage_scores = {'idea': 35, 'mvp': 55, 'seed': 72, 'series-a': 88}
    base = stage_scores.get(startup_data.get('stage', 'idea'), 40)
    success_prob = min(95, base + startup_data.get('team_size', 1) * 4 + len(startup_data.get('required_skills', []) or []) * 2)
    prompt = f"""Startup analysis JSON: {startup_data.get('name')}, stage {startup_data.get('stage')}, domain {startup_data.get('domain')}
Keys: success_probability, innovation_score, market_potential, risk_level, insights (3), recommendations (3). ONLY JSON."""

    fallback = {
        'success_probability': success_prob,
        'innovation_score': min(100, success_prob + 5),
        'market_potential': 'high' if success_prob > 65 else 'medium' if success_prob > 45 else 'low',
        'risk_level': 'low' if success_prob > 70 else 'medium',
        'insights': [f"Position in {startup_data.get('domain', 'tech')}", 'Team velocity matters', 'Validate MVP'],
        'recommendations': ['Customer interviews', 'North-star metric', 'Recruit co-founder'],
    }
    result = _call_gemini(prompt, fallback, expect_type='object')
    if isinstance(result, dict):
        result.pop('_meta', None)
    return result


def ai_innovation_assistant(query, user_context, history=None):
    """
    Real conversational AI using Gemini multi-turn chat.
    Falls back to a smart static response only when Gemini is unavailable.
    """
    api_key = _get_api_key()

    # ── Try real Gemini multi-turn chat first ──────────────────────────────
    if api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)

            model = genai.GenerativeModel(
                _active_model_name or 'gemini-1.5-flash',
                generation_config={
                    'temperature': 0.85,
                    'top_p': 0.95,
                    'max_output_tokens': 2048,
                },
                system_instruction=(
                    "You are InnovX Copilot — an elite AI assistant for student innovators, "
                    "startup founders, and hackathon participants. You think like a senior "
                    "engineer, startup mentor, and career coach combined.\n\n"
                    "You help with: startup ideas & validation, MVP planning, hackathon "
                    "strategy, resume & portfolio building, tech stack selection, system "
                    "architecture, team building, career roadmaps, coding guidance, and "
                    "product thinking.\n\n"
                    "Rules:\n"
                    "- Give UNIQUE, intelligent, deeply contextual responses every time\n"
                    "- Use markdown: **bold**, ## headers, bullet lists, code blocks\n"
                    "- Be specific, actionable, and example-driven\n"
                    "- Adapt tone: technical when asked code, strategic when asked business\n"
                    "- Remember the conversation context and build on it\n"
                    "- Never give generic or template-like answers\n"
                    "- Respond like Gemini/ChatGPT — intelligent and human-like"
                ),
            )

            # Build Gemini chat history format
            gemini_history = []
            for msg in (history or [])[-12:]:
                role = msg.get('role', 'user')
                content = (msg.get('content') or '').strip()
                if not content:
                    continue
                # Gemini uses 'user' and 'model' roles
                gemini_role = 'user' if role == 'user' else 'model'
                gemini_history.append({'role': gemini_role, 'parts': [content]})

            chat = model.start_chat(history=gemini_history)

            # Inject user context into the first message if no history yet
            if not gemini_history and user_context:
                skills = user_context.get('skills', [])
                dept = user_context.get('department', '')
                ctx_note = (
                    f"[User context: {user_context.get('name', 'Student')}, "
                    f"{dept}, skills: {', '.join(skills[:5]) if skills else 'not set'}, "
                    f"{user_context.get('projects_count', 0)} projects, "
                    f"{user_context.get('hackathon_count', 0)} hackathons]\n\n"
                )
                full_query = ctx_note + query
            else:
                full_query = query

            future = _executor.submit(lambda: chat.send_message(full_query))
            response = future.result(timeout=GEMINI_TIMEOUT_SECONDS + 5)
            text = _extract_response_text(response)

            if text:
                # Generate smart follow-up suggestions based on the response
                suggestions = _generate_suggestions(query, text)
                return {
                    'response': text,
                    'suggestions': suggestions,
                    'source': 'gemini',
                    'model': _active_model_name,
                }
        except FuturesTimeoutError:
            logger.error('Gemini chat timed out')
        except Exception as e:
            err = str(e)
            if '429' in err or 'quota' in err.lower():
                logger.warning('Gemini rate limit hit')
            else:
                logger.error('Gemini chat error: %s', e)

    # ── Smart contextual fallback (no Gemini) ─────────────────────────────
    return _smart_fallback_response(query, user_context)


def _generate_suggestions(query, response_text):
    """Generate 3 contextual follow-up suggestions."""
    q = query.lower()
    if any(w in q for w in ['startup', 'idea', 'business']):
        return ['How do I validate this idea?', 'What tech stack should I use?', 'How to find co-founders?']
    if any(w in q for w in ['hackathon', 'hack', 'competition']):
        return ['How to build an MVP in 24 hours?', 'What makes a winning demo?', 'Best tech stack for hackathons?']
    if any(w in q for w in ['resume', 'job', 'internship', 'career']):
        return ['How to improve my GitHub profile?', 'What skills are most in demand?', 'How to ace technical interviews?']
    if any(w in q for w in ['code', 'build', 'develop', 'architecture']):
        return ['How to deploy this project?', 'How to make it scalable?', 'What testing strategy should I use?']
    if any(w in q for w in ['learn', 'roadmap', 'skill']):
        return ['What projects should I build?', 'Which certifications matter?', 'How long will this take?']
    return ['Tell me more', 'Give me an example', 'What should I do next?']


def _smart_fallback_response(query, user_context):
    """Intelligent fallback when Gemini is unavailable."""
    q = query.lower()
    name = user_context.get('name', 'there')
    skills = user_context.get('skills', [])
    skills_str = ', '.join(skills[:3]) if skills else 'your current skills'

    if any(w in q for w in ['startup', 'idea', 'business', 'product']):
        response = f"""## Startup Strategy for You, {name} 🚀

**Based on your profile**, here's a focused approach:

### Validate Before Building
1. **Problem First** — Write down the exact pain point in one sentence
2. **Talk to 10 users** — Before writing a single line of code
3. **Define your unfair advantage** — What do you know that others don't?

### MVP Framework (2-week sprint)
- **Week 1**: Core feature only — the one thing that solves the problem
- **Week 2**: Ship to 5 real users, collect feedback

### With your skills ({skills_str}), consider:
- A **SaaS tool** for students or developers
- An **AI-powered** productivity app
- A **marketplace** connecting two underserved groups

> 💡 *The best startups solve problems the founders personally experienced.*"""
        suggestions = ['How do I find my first users?', 'What tech stack for an MVP?', 'How to pitch to investors?']

    elif any(w in q for w in ['hackathon', 'hack', 'competition', 'win']):
        response = f"""## Hackathon Winning Strategy 🏆

### The 48-Hour Formula

**Hour 0-4: Ideation**
- Pick a problem you *understand deeply*
- Choose a tech stack your team knows well
- Define the demo before writing code

**Hour 4-36: Build**
- Build the **demo path only** — not the full product
- Use: React + Flask/FastAPI + a free AI API
- Deploy early (Vercel + Railway = 10 min setup)

**Hour 36-48: Polish**
- Record a 60-second demo video as backup
- Prepare a 3-slide deck: Problem → Solution → Demo
- Practice the live demo 5 times

### Winning Criteria (most judges care about)
1. **Impact** — Does it solve a real problem?
2. **Technical depth** — Is there something impressive under the hood?
3. **Demo quality** — Does it actually work live?

> 🎯 *Win the demo, not the codebase.*"""
        suggestions = ['Best APIs for hackathons?', 'How to build a team?', 'What makes a great pitch?']

    elif any(w in q for w in ['resume', 'cv', 'job', 'internship', 'interview']):
        response = f"""## Resume & Career Strategy 📄

### Resume That Gets Interviews

**The Formula**: Impact + Number + Technology
- ❌ "Built a web app"
- ✅ "Built a React + Flask web app serving 500+ users with 99.9% uptime"

### With {skills_str}, target these roles:
- **Software Engineering Intern** — Google, Microsoft, Amazon, startups
- **Full Stack Developer** — Product companies, scale-ups
- **AI/ML Engineer** — If you have Python + ML experience

### 30-Day Action Plan
1. **Week 1**: Deploy 1 project publicly (GitHub + live URL)
2. **Week 2**: Update LinkedIn with keywords recruiters search
3. **Week 3**: Apply to 10 companies with tailored cover letters
4. **Week 4**: Practice 5 LeetCode mediums + 2 system design problems

> 💼 *Recruiters spend 7 seconds on a resume. Make the first 3 lines count.*"""
        suggestions = ['How to improve my GitHub?', 'What to say in a cover letter?', 'How to prep for coding interviews?']

    elif any(w in q for w in ['learn', 'roadmap', 'skill', 'study', 'course']):
        response = f"""## Learning Roadmap 🗺️

### Fastest Path to Job-Ready

**Foundation (Month 1-2)**
- Master one language deeply (Python or JavaScript)
- Git + GitHub — commit every day
- Build 2 small projects and deploy them

**Intermediate (Month 3-4)**
- Full-stack: React + REST API + Database
- Learn SQL (PostgreSQL) + basic system design
- Contribute to 1 open-source project

**Advanced (Month 5-6)**
- Cloud basics: AWS or GCP free tier
- Docker + basic CI/CD
- Build your capstone project — something you'd show in an interview

### Best Free Resources
- **CS fundamentals**: MIT OpenCourseWare
- **Web dev**: The Odin Project
- **AI/ML**: fast.ai, Kaggle
- **System design**: System Design Primer (GitHub)

> 📚 *Build more than you watch. 70% projects, 30% courses.*"""
        suggestions = ['What projects should I build?', 'Which certifications are worth it?', 'How to stay consistent?']

    elif any(w in q for w in ['team', 'cofounder', 'collaborate', 'partner']):
        response = f"""## Building Your Dream Team 👥

### Co-founder Compatibility Framework

**The 3 Roles Every Early Team Needs**
1. **The Builder** — Can ship product fast (engineer/designer)
2. **The Seller** — Can talk to users and close deals
3. **The Strategist** — Sees the big picture, handles ops

### Where to Find Teammates
- **InnovX Team Match** — AI-powered skill compatibility
- Hackathons — best place to test chemistry under pressure
- University clubs, LinkedIn, Twitter/X tech communities
- GitHub — find contributors to your open-source projects

### Red Flags to Avoid
- Someone who only talks, never ships
- Misaligned commitment levels (full-time vs side project)
- No complementary skills — two identical people = one wasted seat

> 🤝 *The best co-founder is someone you'd trust with your worst day.*"""
        suggestions = ['How to split equity fairly?', 'When to hire vs find a co-founder?', 'How to resolve team conflicts?']

    else:
        response = f"""## InnovX Copilot Response 🤖

Hi {name}! I'm here to help you with:

- 🚀 **Startup ideas** and validation strategies
- 🏆 **Hackathon** planning and winning tactics
- 📄 **Resume** building and career growth
- 🗺️ **Learning roadmaps** for any tech career
- 💻 **Technical guidance** — architecture, code, deployment
- 👥 **Team building** and collaboration

**Ask me anything specific** and I'll give you a detailed, actionable answer.

Examples:
- *"Give me 3 startup ideas for a CS student"*
- *"How do I win a 24-hour hackathon?"*
- *"Build me a 6-month roadmap to become a full-stack developer"*
- *"Review my approach to building a SaaS product"*"""
        suggestions = ['Give me startup ideas', 'How to win a hackathon?', 'Build my learning roadmap']

    return {
        'response': response,
        'suggestions': suggestions,
        'source': 'fallback',
        'model': 'smart-fallback',
    }


def verify_skills_authenticity(user_data):
    score = 50
    verified, flags = [], []
    if user_data.get('github_url'):
        score += 25
        verified.append('GitHub linked')
    else:
        flags.append('No GitHub')
    if user_data.get('projects_count', 0) >= 2:
        score += 20
        verified.append('Multiple projects')
    if len(user_data.get('skills', []) or []) >= 4:
        score += 10
        verified.append('Rich skills')
    return {
        'authenticity_score': min(score, 100),
        'verified_items': verified,
        'flags': flags,
        'github_verified': bool(user_data.get('github_url')),
        'contribution_authentic': score >= 70,
    }
