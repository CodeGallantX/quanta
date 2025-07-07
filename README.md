# ⚛️ Quanta – Learn Physics & Chemistry Smarter - Yoruba too

**Quanta** is a responsive and interactive learning platform designed for Grade 11 students to master **Physics** and **Chemistry** through structured lessons, interactive evaluations, and a rich pool of practice questions – all powered by **React**, **TailwindCSS**, and **Supabase**.

---

## 🚀 Features

- 🔐 **Authentication** with Supabase (Sign Up, Sign In, Sign Out)
- 🧪 **Subjects:** Physics & Chemistry
- 📚 **Lessons:** Structured, Markdown-rendered content
- 📝 **Evaluation Questions** per lesson (auto-scoring + feedback)
- 🎯 **Practice Mode** with instant explanations
- 📊 **Progress Tracking** (per subject & lesson)
- 👤 **User Profile Page**
- 📱 **Fully Responsive** – built mobile-first

---

## 🧠 Target Audience

Designed specifically for:
- Grade 11 Science students
- Learners preparing for WAEC, IGCSE, NECO, or equivalent
- Self-paced academic explorers

---

## 🧱 Tech Stack

| Layer        | Tech                          |
|--------------|-------------------------------|
| Frontend     | React + Vite                  |
| Styling      | TailwindCSS                   |
| Font         | Poppins                       |
| Auth & DB    | Supabase                      |
| Markdown     | React Markdown Renderer       |
| State Mgmt   | React Context API / Zustand   |
| Hosting      | Vercel (Optimized for SSR)    |

---

## 🗂️ Folder Structure

```

quanta/
├── public/
├── src/
│   ├── components/
│   ├── pages/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── lessons/
│   │   └── practice/
│   ├── routes/
│   ├── context/
│   ├── lib/ (Supabase Client, Helpers)
│   └── styles/
├── supabase/
│   └── schema.sql
├── .env
└── README.md

````

---

## 🛠️ Supabase Schema Overview

### `users`
| Field       | Type     | Description                     |
|-------------|----------|---------------------------------|
| id          | UUID     | Supabase Auth User ID           |
| full_name   | TEXT     | Student's name                  |
| email       | TEXT     | Email (unique)                  |
| class       | TEXT     | E.g., "Grade 11"                |
| progress    | JSONB    | Completed lessons               |
| created_at  | TIMESTAMPTZ | Default: `now()`            |

### `subjects`
| Field       | Type     | Description                     |
|-------------|----------|---------------------------------|
| id          | TEXT     | "physics", "chemistry"          |
| name        | TEXT     | Full subject name               |
| description | TEXT     | Short intro to the subject      |

### `lessons`
| Field       | Type     | Description                     |
|-------------|----------|---------------------------------|
| id          | TEXT     | "physics-lesson-1"              |
| subject_id  | TEXT     | FK to subjects                  |
| title       | TEXT     | Lesson title                    |
| content     | TEXT     | Markdown lesson body            |
| order       | INT      | For sorting                     |
| evaluation_questions | JSONB | Questions + Answers     |

### `practice_questions`
| Field       | Type     | Description                     |
|-------------|----------|---------------------------------|
| id          | UUID     | Auto-generated ID               |
| subject_id  | TEXT     | FK to subjects                  |
| topic       | TEXT     | E.g., "Motion", "Acids & Bases" |
| question    | TEXT     | Main question text              |
| options     | JSONB    | Array of answers                |
| correct_ans | TEXT     | Correct answer                  |
| explanation | TEXT     | Answer breakdown                |

---

## 🔐 Row-Level Security (RLS)

```sql
-- users
CREATE POLICY "Users can read/write own data"
ON users
FOR ALL
USING (auth.uid() = id);

-- subjects, lessons, practice_questions (read-only)
CREATE POLICY "Public read access"
ON subjects
FOR SELECT
TO public
USING (true);
````

---

## 🧭 Routing Structure

| Path                              | Description                  |
| --------------------------------- | ---------------------------- |
| `/auth/signin`                    | Sign In page                 |
| `/auth/signup`                    | Sign Up page                 |
| `/dashboard`                      | Dashboard home               |
| `/dashboard/physics`              | Physics lessons overview     |
| `/dashboard/physics/lesson/:id`   | Single physics lesson page   |
| `/dashboard/chemistry`            | Chemistry lessons overview   |
| `/dashboard/chemistry/lesson/:id` | Chemistry lesson page        |
| `/dashboard/physics/practice`     | Physics practice questions   |
| `/dashboard/chemistry/practice`   | Chemistry practice questions |
| `/dashboard/profile`              | View & edit user profile     |

---

## 🧪 Sample Evaluation JSON

```json
{
  "evaluation_questions": [
    {
      "questionText": "What is the SI unit of force?",
      "options": ["Newton", "Pascal", "Joule", "Watt"],
      "correctAnswer": "Newton",
      "explanation": "Force is measured in Newtons (N), named after Isaac Newton."
    }
  ]
}
```

---

## 🧑‍💻 Getting Started (Dev)

```bash
# 1. Clone the repo
git clone https://github.com/codegallantx/quanta.git
cd quanta

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Fill in your Supabase URL and anon/public key

# 4. Run locally
npm run dev
```

---

## ✨ Coming Soon

* Dark mode toggle
* Filter practice questions by topic or difficulty
* Gemini API integration for smart tutoring
* Admin dashboard for managing questions/lessons

---

## 📜 License

MIT License – free to modify, use, and distribute.

---

## 💡 Credits

Built with 💙 by CodeGallantX + Lovable
Powered by Supabase, TailwindCSS, and the magic of curiosity.
