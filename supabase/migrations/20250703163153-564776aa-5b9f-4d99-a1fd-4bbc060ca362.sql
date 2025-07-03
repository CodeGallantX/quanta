
-- Create app_role enum for future use
CREATE TYPE public.app_role AS ENUM ('student', 'teacher', 'admin');

-- Create users table for storing user profiles
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  class TEXT NOT NULL DEFAULT 'Grade 11',
  progress JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subjects table
CREATE TABLE public.subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create lessons table
CREATE TABLE public.lessons (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES public.subjects(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  order_num INTEGER NOT NULL,
  evaluation_questions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create practice_questions table
CREATE TABLE public.practice_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id TEXT NOT NULL REFERENCES public.subjects(id),
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  topic TEXT,
  difficulty TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_progress table to track lesson completions
CREATE TABLE public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES public.lessons(id),
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  score INTEGER,
  UNIQUE(user_id, lesson_id)
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for public read access
CREATE POLICY "Public read access for subjects" ON public.subjects
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public read access for lessons" ON public.lessons
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public read access for practice questions" ON public.practice_questions
  FOR SELECT TO anon, authenticated USING (true);

-- RLS Policies for user_progress
CREATE POLICY "Users can view their own progress" ON public.user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON public.user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON public.user_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, class)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Student'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'class', 'Grade 11')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample subjects
INSERT INTO public.subjects (id, name, description) VALUES
('physics', 'Physics', 'Explore the fundamental laws of nature, motion, energy, and matter'),
('chemistry', 'Chemistry', 'Discover the composition, structure, and properties of matter');

-- Insert sample Physics lessons
INSERT INTO public.lessons (id, subject_id, title, content, order_num, evaluation_questions) VALUES
('physics-lesson-1', 'physics', 'Introduction to Kinematics', 
'# Introduction to Kinematics

## What is Kinematics?

Kinematics is the branch of physics that describes the motion of objects without considering the forces that cause the motion.

## Key Concepts

### Position
- **Position** refers to the location of an object in space
- Usually measured from a reference point (origin)
- Can be described using coordinates (x, y, z)

### Displacement
- **Displacement** is the change in position
- It''s a vector quantity (has both magnitude and direction)
- Formula: Δx = x₂ - x₁

### Velocity
- **Velocity** is the rate of change of displacement
- Average velocity: v = Δx/Δt
- Instantaneous velocity: v = dx/dt

### Acceleration
- **Acceleration** is the rate of change of velocity
- Average acceleration: a = Δv/Δt
- Instantaneous acceleration: a = dv/dt

## Kinematic Equations

For motion with constant acceleration:

1. v = u + at
2. s = ut + ½at²
3. v² = u² + 2as
4. s = (u + v)t/2

Where:
- u = initial velocity
- v = final velocity
- a = acceleration
- t = time
- s = displacement

## Example Problem

A car accelerates from rest at 2 m/s² for 5 seconds. Find:
1. Final velocity
2. Distance traveled

**Solution:**
1. v = u + at = 0 + 2×5 = 10 m/s
2. s = ut + ½at² = 0×5 + ½×2×5² = 25 m

## Practice

Now let''s test your understanding with some questions!', 
1, 
'[
  {
    "question": "What is kinematics?",
    "options": ["Study of forces", "Study of motion without considering forces", "Study of energy", "Study of matter"],
    "correct_answer": "Study of motion without considering forces",
    "explanation": "Kinematics describes motion without considering the forces that cause it."
  },
  {
    "question": "If a car starts from rest and accelerates at 3 m/s² for 4 seconds, what is its final velocity?",
    "options": ["7 m/s", "12 m/s", "15 m/s", "20 m/s"],
    "correct_answer": "12 m/s",
    "explanation": "Using v = u + at: v = 0 + 3×4 = 12 m/s"
  },
  {
    "question": "Displacement is a:",
    "options": ["Scalar quantity", "Vector quantity", "Neither scalar nor vector", "Both scalar and vector"],
    "correct_answer": "Vector quantity",
    "explanation": "Displacement has both magnitude and direction, making it a vector quantity."
  },
  {
    "question": "Which equation relates velocity, acceleration, and displacement?",
    "options": ["v = u + at", "s = ut + ½at²", "v² = u² + 2as", "s = (u + v)t/2"],
    "correct_answer": "v² = u² + 2as",
    "explanation": "The equation v² = u² + 2as directly relates final velocity, initial velocity, acceleration, and displacement."
  },
  {
    "question": "If an object moves 100m in 10 seconds with constant velocity, what is its velocity?",
    "options": ["5 m/s", "10 m/s", "15 m/s", "20 m/s"],
    "correct_answer": "10 m/s",
    "explanation": "Velocity = displacement/time = 100m/10s = 10 m/s"
  }
]'),

('physics-lesson-2', 'physics', 'Forces and Newton''s Laws', 
'# Forces and Newton''s Laws

## What is a Force?

A **force** is a push or pull that can cause an object to accelerate, decelerate, or change direction.

## Newton''s First Law (Law of Inertia)

*"An object at rest stays at rest, and an object in motion stays in motion with the same speed and in the same direction, unless acted upon by an unbalanced force."*

### Key Points:
- Objects resist changes in their state of motion
- This resistance is called **inertia**
- Inertia depends on mass - more massive objects have more inertia

## Newton''s Second Law

*"The acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass."*

### Mathematical Form:
**F = ma**

Where:
- F = net force (Newtons)
- m = mass (kg)
- a = acceleration (m/s²)

### Important Notes:
- Force and acceleration are vector quantities
- Net force is the sum of all forces acting on an object
- If net force = 0, acceleration = 0 (object moves at constant velocity)

## Newton''s Third Law

*"For every action, there is an equal and opposite reaction."*

### Examples:
- Walking: You push backward on the ground, ground pushes forward on you
- Swimming: You push water backward, water pushes you forward
- Rocket propulsion: Exhaust gases pushed down, rocket pushed up

## Types of Forces

### Contact Forces:
- **Normal force**: Perpendicular to surface
- **Friction**: Opposes motion
- **Tension**: Force in strings/ropes
- **Applied force**: Force applied by a person or object

### Non-contact Forces:
- **Gravitational force**: F = mg (near Earth''s surface)
- **Electromagnetic force**
- **Nuclear forces**

## Free Body Diagrams

A free body diagram shows all forces acting on an object:
1. Draw the object as a dot or simple shape
2. Draw arrows representing all forces
3. Label each force with its magnitude and direction

## Example Problem

A 10 kg box is pushed with a force of 50 N. If friction is 20 N, find the acceleration.

**Solution:**
- Net force = Applied force - Friction = 50 N - 20 N = 30 N
- Using F = ma: 30 = 10 × a
- Therefore: a = 3 m/s²

## Weight vs Mass

- **Mass**: Amount of matter in an object (kg)
- **Weight**: Gravitational force on an object (N)
- Weight = mg (where g = 9.8 m/s² on Earth)', 
2, 
'[
  {
    "question": "What does Newton''s First Law state?",
    "options": ["F = ma", "Objects resist changes in motion", "Every action has an equal reaction", "Force equals weight"],
    "correct_answer": "Objects resist changes in motion",
    "explanation": "Newton''s First Law (Law of Inertia) states that objects resist changes in their state of motion."
  },
  {
    "question": "If a 5 kg object experiences a net force of 20 N, what is its acceleration?",
    "options": ["2 m/s²", "4 m/s²", "15 m/s²", "25 m/s²"],
    "correct_answer": "4 m/s²",
    "explanation": "Using F = ma: 20 = 5 × a, so a = 4 m/s²"
  },
  {
    "question": "Which is an example of Newton''s Third Law?",
    "options": ["A ball rolling down a hill", "Walking on the ground", "A car braking", "An object falling"],
    "correct_answer": "Walking on the ground",
    "explanation": "When walking, you push backward on the ground and the ground pushes forward on you - equal and opposite forces."
  },
  {
    "question": "What is the weight of a 10 kg object on Earth? (g = 9.8 m/s²)",
    "options": ["10 N", "98 N", "9.8 N", "19.6 N"],
    "correct_answer": "98 N",
    "explanation": "Weight = mg = 10 kg × 9.8 m/s² = 98 N"
  },
  {
    "question": "If the net force on an object is zero, the object will:",
    "options": ["Accelerate", "Move at constant velocity", "Stop immediately", "Change direction"],
    "correct_answer": "Move at constant velocity",
    "explanation": "When net force is zero, acceleration is zero, so the object maintains constant velocity (which could be zero if at rest)."
  }
]');

-- Insert sample Chemistry lessons
INSERT INTO public.lessons (id, subject_id, title, content, order_num, evaluation_questions) VALUES
('chemistry-lesson-1', 'chemistry', 'Atomic Structure and Periodic Table', 
'# Atomic Structure and Periodic Table

## Atomic Structure

### Basic Components of an Atom

An atom consists of three main particles:

1. **Protons** (p⁺)
   - Positively charged
   - Located in the nucleus
   - Mass ≈ 1 atomic mass unit (amu)
   - Determine the element''s identity

2. **Neutrons** (n⁰)
   - Neutral (no charge)
   - Located in the nucleus
   - Mass ≈ 1 amu
   - Determine isotopes

3. **Electrons** (e⁻)
   - Negatively charged
   - Orbit around the nucleus
   - Mass ≈ 1/1836 amu (negligible)
   - Determine chemical properties

### Atomic Number and Mass Number

- **Atomic Number (Z)**: Number of protons in an atom
- **Mass Number (A)**: Total number of protons and neutrons
- **Isotopes**: Atoms with same atomic number but different mass numbers

### Electron Configuration

Electrons occupy energy levels (shells) around the nucleus:
- **K shell**: Maximum 2 electrons
- **L shell**: Maximum 8 electrons  
- **M shell**: Maximum 18 electrons
- **N shell**: Maximum 32 electrons

## The Periodic Table

### Organization

The periodic table is organized by:
- **Periods**: Horizontal rows (same number of electron shells)
- **Groups**: Vertical columns (same number of valence electrons)

### Key Groups

1. **Group 1**: Alkali metals (1 valence electron)
2. **Group 2**: Alkaline earth metals (2 valence electrons)
3. **Group 17**: Halogens (7 valence electrons)
4. **Group 18**: Noble gases (8 valence electrons, except He with 2)

### Periodic Trends

1. **Atomic Size**: Decreases across a period, increases down a group
2. **Ionization Energy**: Increases across a period, decreases down a group
3. **Electronegativity**: Increases across a period, decreases down a group

## Chemical Bonding Basics

### Ionic Bonding
- Transfer of electrons from metal to non-metal
- Forms ions: cations (positive) and anions (negative)
- Example: NaCl (sodium chloride)

### Covalent Bonding
- Sharing of electrons between non-metals
- Forms molecules
- Example: H₂O (water), CO₂ (carbon dioxide)

## Example: Sodium (Na)

- Atomic number: 11
- Electron configuration: 2, 8, 1
- Group 1 (alkali metal)
- Period 3
- Tends to lose 1 electron to form Na⁺ ion

## Practice Problems

Understanding atomic structure helps predict:
- Chemical behavior
- Bonding patterns
- Physical properties
- Reactivity', 
1, 
'[
  {
    "question": "What determines the identity of an element?",
    "options": ["Number of neutrons", "Number of protons", "Number of electrons", "Atomic mass"],
    "correct_answer": "Number of protons",
    "explanation": "The atomic number (number of protons) determines the identity of an element."
  },
  {
    "question": "How many electrons can the L shell hold?",
    "options": ["2", "8", "18", "32"],
    "correct_answer": "8",
    "explanation": "The L shell (second energy level) can hold a maximum of 8 electrons."
  },
  {
    "question": "Elements in the same group have the same:",
    "options": ["Number of protons", "Number of neutrons", "Number of valence electrons", "Atomic mass"],
    "correct_answer": "Number of valence electrons",
    "explanation": "Elements in the same group (vertical column) have the same number of valence electrons."
  },
  {
    "question": "What type of bond forms between a metal and a non-metal?",
    "options": ["Covalent bond", "Ionic bond", "Metallic bond", "Hydrogen bond"],
    "correct_answer": "Ionic bond",
    "explanation": "Ionic bonds form when electrons are transferred from a metal to a non-metal."
  },
  {
    "question": "Which group contains the noble gases?",
    "options": ["Group 1", "Group 2", "Group 17", "Group 18"],
    "correct_answer": "Group 18",
    "explanation": "Group 18 contains the noble gases, which have complete outer electron shells."
  }
]'),

('chemistry-lesson-2', 'chemistry', 'Chemical Reactions and Equations', 
'# Chemical Reactions and Equations

## What is a Chemical Reaction?

A **chemical reaction** is a process where one or more substances (reactants) are converted into different substances (products) with different properties.

## Signs of a Chemical Reaction

1. **Color change**: Iron rusting (brown color)
2. **Gas evolution**: Fizzing when acid meets carbonate
3. **Precipitate formation**: Solid forms in solution
4. **Temperature change**: Heat released or absorbed
5. **Light emission**: Burning magnesium

## Types of Chemical Reactions

### 1. Combination Reactions (Synthesis)
Two or more reactants combine to form one product.

**General form**: A + B → AB

**Example**: 2H₂ + O₂ → 2H₂O

### 2. Decomposition Reactions
One reactant breaks down into two or more products.

**General form**: AB → A + B

**Example**: 2H₂O → 2H₂ + O₂ (electrolysis)

### 3. Single Displacement Reactions
One element displaces another in a compound.

**General form**: A + BC → AC + B

**Example**: Zn + CuSO₄ → ZnSO₄ + Cu

### 4. Double Displacement Reactions
Two compounds exchange ions.

**General form**: AB + CD → AD + CB

**Example**: AgNO₃ + NaCl → AgCl + NaNO₃

### 5. Combustion Reactions
Substance reacts with oxygen, usually producing heat and light.

**Example**: CH₄ + 2O₂ → CO₂ + 2H₂O

## Chemical Equations

### Writing Chemical Equations

1. **Word equation**: Reactants → Products
2. **Formula equation**: Use chemical formulas
3. **Balanced equation**: Equal atoms on both sides

### Balancing Chemical Equations

**Steps**:
1. Write the unbalanced equation
2. Count atoms of each element
3. Add coefficients to balance
4. Check your work

**Example**: Balance H₂ + O₂ → H₂O

1. Unbalanced: H₂ + O₂ → H₂O
2. Count: Left (2H, 2O), Right (2H, 1O)
3. Add coefficient: 2H₂ + O₂ → 2H₂O
4. Check: Left (4H, 2O), Right (4H, 2O) ✓

## Conservation Laws

### Law of Conservation of Mass
- Mass is neither created nor destroyed in a chemical reaction
- Total mass of reactants = Total mass of products
- This is why we balance equations

### Law of Conservation of Energy
- Energy cannot be created or destroyed
- Can be converted from one form to another
- Chemical energy ↔ Heat, light, electrical energy

## Catalysts

**Catalysts** are substances that:
- Speed up chemical reactions
- Are not consumed in the reaction
- Lower the activation energy needed
- Can be recovered unchanged

**Examples**:
- Enzymes in biological systems
- Platinum in car catalytic converters
- Iron in Haber process (NH₃ production)

## Reaction Rates

Factors affecting reaction rate:
1. **Temperature**: Higher temperature = faster reaction
2. **Concentration**: Higher concentration = faster reaction
3. **Surface area**: Larger surface area = faster reaction
4. **Catalysts**: Presence of catalyst = faster reaction

## Practice Example

Balance the equation: Fe + O₂ → Fe₂O₃

**Solution**:
1. Count atoms: Fe (1), O (2) → Fe (2), O (3)
2. Balance Fe: 2Fe + O₂ → Fe₂O₃
3. Balance O: 4Fe + 3O₂ → 2Fe₂O₃
4. Final: 4Fe + 3O₂ → 2Fe₂O₃', 
2, 
'[
  {
    "question": "What is a sign that a chemical reaction has occurred?",
    "options": ["Change in shape", "Change in color", "Change in size", "Change in weight"],
    "correct_answer": "Change in color",
    "explanation": "Color change is one of the observable signs that a chemical reaction has occurred."
  },
  {
    "question": "In the reaction 2H₂ + O₂ → 2H₂O, what type of reaction is this?",
    "options": ["Decomposition", "Combination", "Single displacement", "Double displacement"],
    "correct_answer": "Combination",
    "explanation": "This is a combination reaction where two reactants (H₂ and O₂) combine to form one product (H₂O)."
  },
  {
    "question": "What does the Law of Conservation of Mass state?",
    "options": ["Mass increases in reactions", "Mass decreases in reactions", "Mass is conserved in reactions", "Mass changes randomly"],
    "correct_answer": "Mass is conserved in reactions",
    "explanation": "The Law of Conservation of Mass states that mass is neither created nor destroyed in chemical reactions."
  },
  {
    "question": "What is the balanced equation for: Fe + O₂ → Fe₂O₃?",
    "options": ["Fe + O₂ → Fe₂O₃", "2Fe + O₂ → Fe₂O₃", "4Fe + 3O₂ → 2Fe₂O₃", "3Fe + 2O₂ → Fe₂O₃"],
    "correct_answer": "4Fe + 3O₂ → 2Fe₂O₃",
    "explanation": "Balancing gives us 4 Fe atoms and 6 O atoms on each side of the equation."
  },
  {
    "question": "What do catalysts do in chemical reactions?",
    "options": ["Slow down reactions", "Speed up reactions", "Stop reactions", "Have no effect"],
    "correct_answer": "Speed up reactions",
    "explanation": "Catalysts speed up chemical reactions by lowering the activation energy required."
  }
]');

-- Insert sample practice questions for Physics
INSERT INTO public.practice_questions (subject_id, question, options, correct_answer, explanation, topic, difficulty) VALUES
('physics', 'A car travels 100 km in 2 hours. What is its average speed?', 
'["25 km/h", "50 km/h", "75 km/h", "100 km/h"]', 
'50 km/h', 
'Average speed = Total distance / Total time = 100 km / 2 h = 50 km/h', 
'Kinematics', 'easy'),

('physics', 'An object is dropped from rest. After 3 seconds, what is its velocity? (g = 10 m/s²)', 
'["10 m/s", "20 m/s", "30 m/s", "40 m/s"]', 
'30 m/s', 
'Using v = u + gt, where u = 0: v = 0 + 10×3 = 30 m/s', 
'Kinematics', 'medium'),

('physics', 'What is the acceleration of a 10 kg object when a 50 N force is applied?', 
'["2 m/s²", "5 m/s²", "10 m/s²", "15 m/s²"]', 
'5 m/s²', 
'Using F = ma: 50 = 10 × a, therefore a = 5 m/s²', 
'Forces', 'easy'),

('physics', 'If two forces of 30 N and 40 N act perpendicular to each other, what is the resultant force?', 
'["35 N", "50 N", "70 N", "1200 N"]', 
'50 N', 
'Using Pythagorean theorem: F = √(30² + 40²) = √(900 + 1600) = √2500 = 50 N', 
'Forces', 'medium'),

('physics', 'A ball is thrown upward with initial velocity 20 m/s. How high does it go? (g = 10 m/s²)', 
'["10 m", "20 m", "30 m", "40 m"]', 
'20 m', 
'Using v² = u² + 2as, where v = 0 at max height: 0 = 20² - 2×10×s, so s = 400/20 = 20 m', 
'Kinematics', 'hard'),

('physics', 'What is the momentum of a 5 kg object moving at 10 m/s?', 
'["15 kg⋅m/s", "50 kg⋅m/s", "2 kg⋅m/s", "0.5 kg⋅m/s"]', 
'50 kg⋅m/s', 
'Momentum = mass × velocity = 5 kg × 10 m/s = 50 kg⋅m/s', 
'Forces', 'easy');

-- Insert sample practice questions for Chemistry
INSERT INTO public.practice_questions (subject_id, question, options, correct_answer, explanation, topic, difficulty) VALUES
('chemistry', 'What is the atomic number of carbon?', 
'["4", "6", "12", "14"]', 
'6', 
'Carbon has 6 protons, which determines its atomic number.', 
'Atomic Structure', 'easy'),

('chemistry', 'How many valence electrons does oxygen have?', 
'["2", "4", "6", "8"]', 
'6', 
'Oxygen has electron configuration 2,6, so it has 6 valence electrons.', 
'Atomic Structure', 'easy'),

('chemistry', 'What type of bond forms in NaCl?', 
'["Covalent", "Ionic", "Metallic", "Hydrogen"]', 
'Ionic', 
'NaCl forms when Na⁺ and Cl⁻ ions are held together by electrostatic attraction (ionic bonding).', 
'Chemical Bonding', 'medium'),

('chemistry', 'Balance the equation: H₂ + Cl₂ → HCl', 
'["H₂ + Cl₂ → HCl", "H₂ + Cl₂ → 2HCl", "2H₂ + Cl₂ → 2HCl", "H₂ + 2Cl₂ → 2HCl"]', 
'H₂ + Cl₂ → 2HCl', 
'One H₂ molecule and one Cl₂ molecule produce 2 HCl molecules to balance the equation.', 
'Chemical Equations', 'medium'),

('chemistry', 'Which group contains the alkali metals?', 
'["Group 1", "Group 2", "Group 17", "Group 18"]', 
'Group 1', 
'Group 1 elements (Li, Na, K, etc.) are the alkali metals with 1 valence electron.', 
'Periodic Table', 'easy'),

('chemistry', 'What is produced when an acid reacts with a carbonate?', 
'["Water only", "Salt and water", "Salt, water, and CO₂", "Nothing"]', 
'Salt, water, and CO₂', 
'Acid + Carbonate → Salt + Water + Carbon dioxide (CO₂)', 
'Chemical Reactions', 'medium');
