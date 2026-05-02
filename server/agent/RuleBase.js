/**
 * RuleBase.js — Hybrid Rule Engine
 * Step 1: Check here before any LLM call.
 * Provides high-quality, predefined quiz questions + career metadata
 * for the most common learning goals.
 *
 * Logic:
 *   if (RuleBase.hasQuiz(domainId)) → use predefined questions (no API call)
 *   else                            → call LLM / fallback generator
 */

const RULE_BASE = {

  // ── Frontend Development ───────────────────────────────────────────────────
  frontend_development: {
    label: 'Frontend Development',
    icon: '⚛️',
    careerPaths: ['Frontend Developer', 'React Developer', 'UI Engineer', 'Web Developer'],
    resources: [
      { label: 'React Official Docs', url: 'https://react.dev/', icon: '⚛️' },
      { label: 'MDN Web Docs', url: 'https://developer.mozilla.org/', icon: '📖' },
      { label: 'CSS-Tricks', url: 'https://css-tricks.com/', icon: '🎨' },
      { label: 'JavaScript.info', url: 'https://javascript.info/', icon: '⚡' },
    ],
    quizQuestions: [
      {
        id: 'rb_fe_q1', skillId: 'javascript_fundamentals', skillName: 'JavaScript Fundamentals',
        concept: 'Closures & Scope',
        difficulty: 'basic',
        question: 'What is a closure in JavaScript?',
        type: 'multiple_choice',
        options: [
          'A) A function that has access to variables from its outer (enclosing) scope even after the outer function has returned',
          'B) A built-in method that closes a browser window',
          'C) A way to declare private class variables using the # symbol',
          'D) A design pattern that prevents functions from being called more than once',
        ],
        correct: 'A) A function that has access to variables from its outer (enclosing) scope even after the outer function has returned',
        explanation: 'A closure is formed when a function "remembers" the variables from its lexical scope even when executed outside that scope. This is fundamental to callbacks, event handlers, and module patterns.',
        key_concepts: ['closure', 'lexical scope', 'outer function'],
        score_keywords: ['outer', 'scope', 'returned', 'lexical'],
      },
      {
        id: 'rb_fe_q2', skillId: 'react_fundamentals', skillName: 'React Fundamentals',
        concept: 'Virtual DOM & Reconciliation',
        difficulty: 'moderate',
        question: 'In React, when does a component re-render?',
        type: 'multiple_choice',
        options: [
          'A) Only when the page is refreshed',
          'B) When its state or props change, or when its parent re-renders',
          'C) Every 16ms to match the 60fps refresh rate',
          'D) Only when explicitly called with forceUpdate()',
        ],
        correct: 'B) When its state or props change, or when its parent re-renders',
        explanation: 'React re-renders a component when: (1) its own state changes via setState/useState, (2) props passed by a parent change, or (3) its parent component re-renders (unless memoized with React.memo).',
        key_concepts: ['re-render', 'state', 'props', 'React.memo'],
        score_keywords: ['state', 'props', 'parent'],
      },
      {
        id: 'rb_fe_q3', skillId: 'css_layouts', skillName: 'CSS Layouts',
        concept: 'CSS Flexbox vs Grid',
        difficulty: 'advanced',
        question: 'Which CSS layout system is best suited for a two-dimensional grid of cards with auto-placement?',
        type: 'multiple_choice',
        options: [
          'A) Flexbox — because flex-wrap handles both rows and columns automatically',
          'B) CSS Grid — because it was designed for 2D layouts with explicit row and column control',
          'C) CSS Table — because tables naturally create 2D layouts',
          'D) Absolute positioning — because it gives exact pixel control over placement',
        ],
        correct: 'B) CSS Grid — because it was designed for 2D layouts with explicit row and column control',
        explanation: 'CSS Grid is the right tool for 2D layouts. It allows you to define explicit rows AND columns, and auto-placement fills cells intelligently. Flexbox is 1D (row OR column), making true 2D grids harder to manage.',
        key_concepts: ['CSS Grid', 'Flexbox', '2D layout', 'auto-placement'],
        score_keywords: ['grid', '2d', 'rows', 'columns'],
      },
      {
        id: 'rb_fe_q4', skillId: 'react_hooks', skillName: 'React Hooks',
        concept: 'useEffect & Side Effects',
        difficulty: 'practical',
        question: 'You\'re building a component that fetches user data from an API when it mounts. Which hook and dependency array is correct?',
        type: 'multiple_choice',
        options: [
          'A) useEffect(() => { fetchUser(); }, []) — runs once on mount',
          'B) useEffect(() => { fetchUser(); }) — runs on every render',
          'C) useState(() => { fetchUser(); }, []) — initializes with fetched data',
          'D) useMemo(() => { fetchUser(); }, []) — memoizes the fetch result',
        ],
        correct: 'A) useEffect(() => { fetchUser(); }, []) — runs once on mount',
        explanation: 'useEffect with an empty dependency array [] runs only once after the initial render (mount). This is the correct pattern for one-time API calls. No dependency array runs after every render; useMemo/useState are not for side effects.',
        key_concepts: ['useEffect', 'empty dependency array', 'mount', 'side effects'],
        score_keywords: ['empty', '[]', 'mount', 'once'],
      },
      {
        id: 'rb_fe_q5', skillId: 'javascript_async', skillName: 'JavaScript Async',
        concept: 'Promises & async/await',
        difficulty: 'real_world',
        question: 'A senior developer asks you to refactor a deeply nested chain of .then() callbacks (callback hell) into cleaner code. What is the best approach?',
        type: 'multiple_choice',
        options: [
          'A) Convert to async/await syntax — it makes async code read like synchronous code',
          'B) Use setTimeout to space out the callbacks',
          'C) Convert all promises to synchronous XMLHttpRequest calls',
          'D) Wrap everything in a single mega .then() with multiple nested conditions',
        ],
        correct: 'A) Convert to async/await syntax — it makes async code read like synchronous code',
        explanation: 'async/await is syntactic sugar over Promises that eliminates callback hell. async functions always return a Promise, and await pauses execution until the Promise resolves. It enables try/catch for error handling and makes sequential async code readable.',
        key_concepts: ['async/await', 'Promise', 'callback hell', 'refactoring'],
        score_keywords: ['async', 'await', 'promise', 'synchronous'],
      },
    ],
  },

  // ── Backend Development ────────────────────────────────────────────────────
  backend_development: {
    label: 'Backend Development',
    icon: '💻',
    careerPaths: ['Backend Developer', 'Node.js Developer', 'API Engineer', 'Server-Side Developer'],
    resources: [
      { label: 'Node.js Docs', url: 'https://nodejs.org/en/docs', icon: '🟢' },
      { label: 'Express.js Guide', url: 'https://expressjs.com/', icon: '🚀' },
      { label: 'PostgreSQL Docs', url: 'https://www.postgresql.org/docs/', icon: '🐘' },
      { label: 'REST API Design Guide', url: 'https://restfulapi.net/', icon: '🔌' },
    ],
    quizQuestions: [
      {
        id: 'rb_be_q1', skillId: 'rest_api', skillName: 'REST API Design',
        concept: 'HTTP Methods & Status Codes',
        difficulty: 'basic',
        question: 'Which HTTP method and status code should be returned when a resource is successfully created via an API endpoint?',
        type: 'multiple_choice',
        options: [
          'A) POST request → 201 Created',
          'B) GET request → 200 OK',
          'C) PUT request → 204 No Content',
          'D) POST request → 200 OK',
        ],
        correct: 'A) POST request → 201 Created',
        explanation: 'POST is the correct method for creating resources. The response should be 201 Created (not 200 OK) because 201 specifically signals that a new resource was successfully created. The response body typically includes the created resource.',
        key_concepts: ['HTTP POST', '201 Created', 'REST conventions', 'status codes'],
        score_keywords: ['post', '201', 'created'],
      },
      {
        id: 'rb_be_q2', skillId: 'databases', skillName: 'Database Design',
        concept: 'Indexing & Query Performance',
        difficulty: 'moderate',
        question: 'A query `SELECT * FROM orders WHERE customer_id = 42` is running slowly on a table with 10 million rows. What is the most effective first fix?',
        type: 'multiple_choice',
        options: [
          'A) Add an index on the customer_id column',
          'B) Increase the database server RAM',
          'C) Split the table into two separate tables',
          'D) Use SELECT * FROM orders LIMIT 1000 to reduce result size',
        ],
        correct: 'A) Add an index on the customer_id column',
        explanation: 'Without an index, the database performs a full table scan — checking all 10M rows. An index on customer_id creates a B-tree structure that allows the query to jump directly to matching rows in O(log n) time instead of O(n).',
        key_concepts: ['database index', 'query performance', 'full table scan', 'B-tree'],
        score_keywords: ['index', 'customer_id', 'scan', 'performance'],
      },
      {
        id: 'rb_be_q3', skillId: 'authentication', skillName: 'Authentication & Security',
        concept: 'JWT & Session Security',
        difficulty: 'advanced',
        question: 'What is the critical security difference between storing a JWT in localStorage vs an httpOnly cookie?',
        type: 'multiple_choice',
        options: [
          'A) localStorage is accessible via JavaScript (XSS risk); httpOnly cookies are not accessible to JS at all',
          'B) httpOnly cookies expire after 24 hours; localStorage tokens do not expire',
          'C) localStorage is encrypted by the browser; httpOnly cookies are sent in plain text',
          'D) There is no security difference — both are equally safe',
        ],
        correct: 'A) localStorage is accessible via JavaScript (XSS risk); httpOnly cookies are not accessible to JS at all',
        explanation: 'localStorage can be read by any JavaScript on the page — if the site has an XSS vulnerability, an attacker can steal the token. httpOnly cookies cannot be read by JavaScript at all (only sent with HTTP requests), making them immune to XSS-based token theft.',
        key_concepts: ['JWT', 'XSS', 'httpOnly cookie', 'localStorage', 'security'],
        score_keywords: ['xss', 'httponly', 'javascript', 'accessible'],
      },
      {
        id: 'rb_be_q4', skillId: 'node_express', skillName: 'Node.js & Express',
        concept: 'Middleware & Request Pipeline',
        difficulty: 'practical',
        question: 'In Express.js, what is the correct way to pass control to the next middleware function in the chain?',
        type: 'multiple_choice',
        options: [
          'A) Call next() — the third parameter in the middleware function',
          'B) Return true from the middleware function',
          'C) Call res.continue() to proceed to the next handler',
          'D) Do nothing — Express automatically passes to the next middleware',
        ],
        correct: 'A) Call next() — the third parameter in the middleware function',
        explanation: 'Express middleware functions receive (req, res, next). Calling next() passes control to the next middleware. Without calling next() or sending a response, the request hangs. next(err) skips to error-handling middleware.',
        key_concepts: ['Express middleware', 'next()', 'request pipeline', 'middleware chain'],
        score_keywords: ['next', 'third', 'parameter', 'chain'],
      },
      {
        id: 'rb_be_q5', skillId: 'api_design', skillName: 'API Architecture',
        concept: 'REST vs GraphQL Trade-offs',
        difficulty: 'real_world',
        question: 'Your mobile app makes 8 separate REST calls on the home screen (causing slow load times). A colleague suggests GraphQL. What is the key advantage here?',
        type: 'multiple_choice',
        options: [
          'A) GraphQL allows a single query to fetch exactly the data needed from multiple resources, eliminating over-fetching and N+1 requests',
          'B) GraphQL is always faster because it uses binary encoding instead of JSON',
          'C) GraphQL eliminates the need for a database by caching all data client-side',
          'D) GraphQL automatically scales the server to handle more requests',
        ],
        correct: 'A) GraphQL allows a single query to fetch exactly the data needed from multiple resources, eliminating over-fetching and N+1 requests',
        explanation: 'GraphQL solves over-fetching (getting more fields than needed) and under-fetching (N+1 round trips) by letting the client specify exactly what data it needs in a single request. This is ideal for mobile apps where reducing network calls matters.',
        key_concepts: ['GraphQL', 'over-fetching', 'N+1 problem', 'REST comparison'],
        score_keywords: ['single', 'query', 'over-fetch', 'n+1', 'exactly'],
      },
    ],
  },

  // ── Machine Learning / AI Engineer ────────────────────────────────────────
  machine_learning: {
    label: 'Machine Learning',
    icon: '🧠',
    careerPaths: ['ML Engineer', 'AI Engineer', 'Data Scientist', 'Research Engineer'],
    resources: [
      { label: 'fast.ai Practical Deep Learning', url: 'https://course.fast.ai/', icon: '🔥' },
      { label: 'Hugging Face Learn', url: 'https://huggingface.co/learn', icon: '🤗' },
      { label: 'Kaggle Learn', url: 'https://www.kaggle.com/learn', icon: '🏆' },
      { label: 'Papers With Code', url: 'https://paperswithcode.com/', icon: '📄' },
    ],
    quizQuestions: [
      {
        id: 'rb_ml_q1', skillId: 'ml_fundamentals', skillName: 'ML Fundamentals',
        concept: 'Bias vs Variance Trade-off',
        difficulty: 'basic',
        question: 'A model performs perfectly on training data but poorly on new test data. What is this problem called?',
        type: 'multiple_choice',
        options: [
          'A) Overfitting — the model memorized training data but fails to generalize',
          'B) Underfitting — the model is too simple to capture patterns',
          'C) Data leakage — test data was accidentally included in training',
          'D) Class imbalance — the dataset has unequal class distribution',
        ],
        correct: 'A) Overfitting — the model memorized training data but fails to generalize',
        explanation: 'Overfitting occurs when a model learns training data too specifically — including noise — and fails to generalize. Signs: very low training loss, high validation/test loss. Fix: regularization (L1/L2), dropout, more training data, simpler model.',
        key_concepts: ['overfitting', 'generalization', 'train/test split', 'regularization'],
        score_keywords: ['overfit', 'memorize', 'generalize', 'training'],
      },
      {
        id: 'rb_ml_q2', skillId: 'neural_networks', skillName: 'Neural Networks',
        concept: 'Activation Functions',
        difficulty: 'moderate',
        question: 'Why is ReLU (Rectified Linear Unit) preferred over sigmoid activation in hidden layers of deep networks?',
        type: 'multiple_choice',
        options: [
          'A) ReLU avoids the vanishing gradient problem and is computationally cheaper than sigmoid',
          'B) ReLU always produces values between 0 and 1 like a probability',
          'C) ReLU is differentiable at all points unlike sigmoid',
          'D) ReLU prevents overfitting by randomly setting activations to zero',
        ],
        correct: 'A) ReLU avoids the vanishing gradient problem and is computationally cheaper than sigmoid',
        explanation: 'Sigmoid squashes all values to (0,1), causing gradients to vanish for deep networks. ReLU(x) = max(0,x) keeps gradients alive for positive values (gradient = 1), allowing deeper networks to train. It\'s also just a max operation — computationally trivial.',
        key_concepts: ['ReLU', 'sigmoid', 'vanishing gradient', 'activation function'],
        score_keywords: ['vanishing', 'gradient', 'sigmoid', 'relu'],
      },
      {
        id: 'rb_ml_q3', skillId: 'model_evaluation', skillName: 'Model Evaluation',
        concept: 'Classification Metrics',
        difficulty: 'advanced',
        question: 'A fraud detection model correctly identifies 95% of legitimate transactions but misses 60% of actual fraud cases. Which metric best captures this problem?',
        type: 'multiple_choice',
        options: [
          'A) Low Recall — the model has poor sensitivity to the positive (fraud) class',
          'B) Low Precision — the model produces too many false positives',
          'C) High Accuracy — 95% accuracy means the model is working well',
          'D) Low F1 Score due to high false positive rate',
        ],
        correct: 'A) Low Recall — the model has poor sensitivity to the positive (fraud) class',
        explanation: 'Recall = TP/(TP+FN). Missing 60% of fraud = high False Negatives = low Recall. Accuracy is misleading on imbalanced datasets (most transactions are legitimate). For fraud, missing a fraud (FN) is costlier than a false alarm (FP), so Recall is critical.',
        key_concepts: ['recall', 'precision', 'false negatives', 'class imbalance', 'fraud detection'],
        score_keywords: ['recall', 'false negative', 'sensitivity', 'fraud'],
      },
      {
        id: 'rb_ml_q4', skillId: 'ml_pipeline', skillName: 'ML Pipeline',
        concept: 'Feature Engineering',
        difficulty: 'practical',
        question: 'You have a "date_of_birth" column and need the model to understand age. What is the correct feature engineering approach?',
        type: 'multiple_choice',
        options: [
          'A) Compute age = (today - date_of_birth).years and optionally extract month/day as separate features',
          'B) Drop the column — dates are not useful for ML models',
          'C) Convert the date to a Unix timestamp integer and use it directly',
          'D) One-hot encode every unique date as a binary column',
        ],
        correct: 'A) Compute age = (today - date_of_birth).years and optionally extract month/day as separate features',
        explanation: 'Raw dates are meaningless to models. Deriving age makes the semantic meaning explicit. Extracting month/day can capture seasonality. Unix timestamps preserve order but don\'t communicate age meaning. One-hot encoding dates would create thousands of useless columns.',
        key_concepts: ['feature engineering', 'date features', 'derived features', 'age calculation'],
        score_keywords: ['age', 'derive', 'compute', 'extract'],
      },
      {
        id: 'rb_ml_q5', skillId: 'deep_learning', skillName: 'Deep Learning',
        concept: 'Transfer Learning',
        difficulty: 'real_world',
        question: 'Your company needs an image classifier to detect defects in products, but you only have 500 labelled images. What is the most practical approach?',
        type: 'multiple_choice',
        options: [
          'A) Use transfer learning — fine-tune a pre-trained model (e.g. ResNet, EfficientNet) on your 500 images',
          'B) Train a CNN from scratch — pre-trained models are biased toward their original dataset',
          'C) Use a Random Forest on pixel values — deep learning needs thousands of images',
          'D) Collect 100,000 more images before starting — 500 is never enough',
        ],
        correct: 'A) Use transfer learning — fine-tune a pre-trained model (e.g. ResNet, EfficientNet) on your 500 images',
        explanation: 'Transfer learning is the standard solution for limited data. Pre-trained models already know edges, textures, shapes from ImageNet. Fine-tuning the last few layers on your 500 images applies that knowledge to your domain. You can get strong results with very little data.',
        key_concepts: ['transfer learning', 'fine-tuning', 'pre-trained models', 'limited data'],
        score_keywords: ['transfer', 'fine-tune', 'pretrained', 'resnet'],
      },
    ],
  },

  // ── Data Science ──────────────────────────────────────────────────────────
  data_science: {
    label: 'Data Science',
    icon: '📊',
    careerPaths: ['Data Scientist', 'Data Analyst', 'Business Intelligence Analyst', 'Analytics Engineer'],
    resources: [
      { label: 'Kaggle Datasets & Notebooks', url: 'https://www.kaggle.com/', icon: '🏆' },
      { label: 'Towards Data Science', url: 'https://towardsdatascience.com/', icon: '📰' },
      { label: 'StatQuest with Josh Starmer', url: 'https://statquest.org/', icon: '📹' },
      { label: 'DataCamp', url: 'https://www.datacamp.com/', icon: '🎓' },
    ],
    quizQuestions: [
      {
        id: 'rb_ds_q1', skillId: 'statistics', skillName: 'Statistics Foundations',
        concept: 'Mean vs Median — Outlier Sensitivity',
        difficulty: 'basic',
        question: 'A dataset of employee salaries has one CEO earning $10M while 99 others earn ~$50K. Which measure of central tendency better represents the "typical" salary?',
        type: 'multiple_choice',
        options: [
          'A) Median — it is resistant to outliers and better represents the middle value',
          'B) Mean — it uses all data points so it is always the most accurate',
          'C) Mode — the most frequently occurring salary',
          'D) Standard deviation — it shows the spread of salaries',
        ],
        correct: 'A) Median — it is resistant to outliers and better represents the middle value',
        explanation: 'The mean would be heavily skewed by the $10M salary (~$149K), far above most employees\' pay. The median (middle value when sorted) is resistant to outliers. For skewed distributions like income/housing prices, median is preferred.',
        key_concepts: ['median', 'mean', 'outliers', 'skewed distribution'],
        score_keywords: ['median', 'outlier', 'resistant', 'skewed'],
      },
      {
        id: 'rb_ds_q2', skillId: 'pandas_python', skillName: 'Python & Pandas',
        concept: 'groupby & Aggregation',
        difficulty: 'moderate',
        question: 'In pandas, how do you calculate the average purchase amount per customer ID from a DataFrame `df` with columns [customer_id, purchase_amount]?',
        type: 'multiple_choice',
        options: [
          'A) df.groupby("customer_id")["purchase_amount"].mean()',
          'B) df.mean(by="customer_id")["purchase_amount"]',
          'C) df.average("purchase_amount", group="customer_id")',
          'D) df[df["customer_id"]].purchase_amount.avg()',
        ],
        correct: 'A) df.groupby("customer_id")["purchase_amount"].mean()',
        explanation: 'groupby() splits the DataFrame into groups, then you select the column and apply an aggregation function. This is the fundamental split-apply-combine pattern in pandas. The result is a Series indexed by customer_id.',
        key_concepts: ['groupby', 'aggregation', 'split-apply-combine', 'pandas'],
        score_keywords: ['groupby', 'mean', 'customer_id'],
      },
      {
        id: 'rb_ds_q3', skillId: 'data_visualization', skillName: 'Data Visualization',
        concept: 'Choosing the Right Chart',
        difficulty: 'advanced',
        question: 'You want to show how a company\'s market share changed over 5 years across 4 product categories. Which chart type communicates this best?',
        type: 'multiple_choice',
        options: [
          'A) Stacked area chart — shows both individual trends and total over time',
          'B) Pie chart for each year — shows composition clearly',
          'C) Scatter plot — shows correlation between categories',
          'D) Box plot — shows distribution of share values',
        ],
        correct: 'A) Stacked area chart — shows both individual trends and total over time',
        explanation: 'A stacked area chart communicates two things: (1) how each category\'s share trends over time, and (2) how the total evolves. Multiple pie charts are hard to compare across time. Scatter plots are for correlation. Box plots are for distributions.',
        key_concepts: ['stacked area chart', 'time series', 'composition', 'data storytelling'],
        score_keywords: ['stacked', 'area', 'time', 'trend'],
      },
      {
        id: 'rb_ds_q4', skillId: 'data_cleaning', skillName: 'Data Cleaning',
        concept: 'Handling Missing Values',
        difficulty: 'practical',
        question: 'A dataset has 15% missing values in an "age" column. Which strategy is most appropriate before training a predictive model?',
        type: 'multiple_choice',
        options: [
          'A) Impute with median age (robust to outliers) and add a binary "age_was_missing" indicator column',
          'B) Drop all rows with missing age — 15% is too small to matter',
          'C) Fill with 0 — missing values need a placeholder',
          'D) Impute with mean — it uses all available data',
        ],
        correct: 'A) Impute with median age (robust to outliers) and add a binary "age_was_missing" indicator column',
        explanation: 'Best practice: (1) Use median (not mean) for skewed distributions. (2) Add an indicator column — "missingness" itself is often a predictive signal. Dropping rows wastes data. Filling with 0 introduces a false young age. Mean is sensitive to outliers.',
        key_concepts: ['imputation', 'median', 'missing indicator', 'data preprocessing'],
        score_keywords: ['median', 'impute', 'indicator', 'missing'],
      },
      {
        id: 'rb_ds_q5', skillId: 'business_analysis', skillName: 'Business Analytics',
        concept: 'A/B Testing & Statistical Significance',
        difficulty: 'real_world',
        question: 'An A/B test shows the new landing page converts at 5.2% vs the control\'s 5.0% (p-value = 0.12). Should you ship the new page?',
        type: 'multiple_choice',
        options: [
          'A) No — p=0.12 means there is a 12% chance the result is due to chance; the result is not statistically significant',
          'B) Yes — 5.2% is clearly higher than 5.0%',
          'C) Yes — any improvement, even small, should be shipped immediately',
          'D) No — A/B tests are never reliable for conversion optimization',
        ],
        correct: 'A) No — p=0.12 means there is a 12% chance the result is due to chance; the result is not statistically significant',
        explanation: 'Standard significance threshold is p < 0.05. p=0.12 means there is a 12% probability of seeing this difference by chance even if there\'s no real effect. Shipping based on non-significant results leads to false positives and wasted development. Run the test longer or increase sample size.',
        key_concepts: ['A/B testing', 'p-value', 'statistical significance', 'null hypothesis'],
        score_keywords: ['p-value', 'significant', 'chance', '0.05'],
      },
    ],
  },

  // ── UI/UX Design ──────────────────────────────────────────────────────────
  ui_ux_design: {
    label: 'UI/UX Design',
    icon: '🎨',
    careerPaths: ['UX Designer', 'Product Designer', 'UI Designer', 'Interaction Designer'],
    resources: [
      { label: 'Nielsen Norman Group', url: 'https://www.nngroup.com/articles/', icon: '🔬' },
      { label: 'Figma Learn', url: 'https://www.figma.com/resource-library/', icon: '🎨' },
      { label: 'UX Planet', url: 'https://uxplanet.org/', icon: '🌐' },
      { label: 'Laws of UX', url: 'https://lawsofux.com/', icon: '📏' },
    ],
    quizQuestions: [
      {
        id: 'rb_ux_q1', skillId: 'ux_fundamentals', skillName: 'UX Fundamentals',
        concept: 'Fitts\'s Law & Target Size',
        difficulty: 'basic',
        question: 'According to Fitts\'s Law, which button placement reduces the time to click it?',
        type: 'multiple_choice',
        options: [
          'A) A large button near the user\'s current cursor position',
          'B) A small button precisely centered on the screen',
          'C) A button placed in the bottom-center of a long form',
          'D) A button positioned far from other interactive elements to prevent accidental clicks',
        ],
        correct: 'A) A large button near the user\'s current cursor position',
        explanation: 'Fitts\'s Law: time to hit a target = log2(distance/size + 1). Smaller distance and larger size both reduce interaction time. This is why: (1) primary CTAs should be large, (2) screen corners are fast (infinite size in 2D), (3) related controls should be grouped.',
        key_concepts: ['Fitts\'s Law', 'target size', 'interaction time', 'CTA placement'],
        score_keywords: ['large', 'near', 'distance', 'size'],
      },
      {
        id: 'rb_ux_q2', skillId: 'user_research', skillName: 'User Research',
        concept: 'Usability Testing Methods',
        difficulty: 'moderate',
        question: 'You want to understand WHY users abandon a checkout flow. Which research method is most appropriate?',
        type: 'multiple_choice',
        options: [
          'A) Moderated usability test — observe users completing the checkout while thinking aloud',
          'B) Survey with a 5-point rating scale — quantifies satisfaction',
          'C) Analytics dashboard — shows drop-off points but not reasons',
          'D) Card sorting — tests how users categorize information',
        ],
        correct: 'A) Moderated usability test — observe users completing the checkout while thinking aloud',
        explanation: 'Quantitative data (analytics) tells you WHERE users drop off, not WHY. Think-aloud usability testing captures users\' real-time reasoning, confusion, and decision points. It reveals the specific friction causing abandonment. Analytics then validates the fix at scale.',
        key_concepts: ['usability testing', 'think-aloud', 'qualitative research', 'checkout abandonment'],
        score_keywords: ['usability', 'think aloud', 'observe', 'why'],
      },
      {
        id: 'rb_ux_q3', skillId: 'design_systems', skillName: 'Design Systems',
        concept: 'Component Hierarchy & Tokens',
        difficulty: 'advanced',
        question: 'In a design system, what is the correct relationship between "design tokens", "components", and "patterns"?',
        type: 'multiple_choice',
        options: [
          'A) Tokens (color/spacing values) → Components (Button, Card) → Patterns (Login Form, Nav) — each layer builds on the previous',
          'B) Patterns define tokens, tokens define components, components define the system',
          'C) Components and patterns are the same thing at different screen sizes',
          'D) Tokens are optional — only large organizations need them',
        ],
        correct: 'A) Tokens (color/spacing values) → Components (Button, Card) → Patterns (Login Form, Nav) — each layer builds on the previous',
        explanation: 'Design tokens are atomic values (e.g. --color-primary: #6366F1). Components use tokens to build UI elements (Button with primary color). Patterns combine components into reusable UI solutions (Login form = Input + Button + Link). This hierarchy ensures consistency and easy theme changes.',
        key_concepts: ['design tokens', 'components', 'patterns', 'atomic design'],
        score_keywords: ['tokens', 'components', 'patterns', 'hierarchy'],
      },
      {
        id: 'rb_ux_q4', skillId: 'interaction_design', skillName: 'Interaction Design',
        concept: 'Error Prevention vs Error Recovery',
        difficulty: 'practical',
        question: 'A user accidentally deletes an important file. Which UX principle was violated, and what is the better design?',
        type: 'multiple_choice',
        options: [
          'A) Error prevention was poor — add a confirmation dialog; also provide Undo for error recovery',
          'B) The user made a mistake — UX designers cannot prevent all user errors',
          'C) Add more warning text on the delete button to make users more careful',
          'D) Require users to type "DELETE" to confirm — this prevents all accidental deletions',
        ],
        correct: 'A) Error prevention was poor — add a confirmation dialog; also provide Undo for error recovery',
        explanation: 'Nielsen\'s heuristic #5: Error Prevention. Best defense: (1) confirmation for irreversible actions, (2) Undo (reversibility) — this is error recovery and is often better UX than confirmation dialogs. Typing "DELETE" has high friction for power users. More warning text is ignored.',
        key_concepts: ['error prevention', 'Nielsen heuristics', 'undo', 'confirmation dialog'],
        score_keywords: ['confirmation', 'undo', 'prevent', 'recovery'],
      },
      {
        id: 'rb_ux_q5', skillId: 'design_process', skillName: 'Design Process',
        concept: 'Double Diamond & Iteration',
        difficulty: 'real_world',
        question: 'Stakeholders want to skip user research and go straight to high-fidelity mockups to "save time". What is the best way to respond?',
        type: 'multiple_choice',
        options: [
          'A) Explain that discovering the wrong problem through research is cheaper than building the wrong solution in high-fidelity',
          'B) Agree — stakeholders know the users best and research takes too long',
          'C) Do both in parallel — build mockups while doing research',
          'D) Accept the constraint but secretly do research anyway without telling stakeholders',
        ],
        correct: 'A) Explain that discovering the wrong problem through research is cheaper than building the wrong solution in high-fidelity',
        explanation: 'The cost of discovery is much lower than the cost of rework. Research at the "Discover" phase prevents building the wrong product. High-fidelity mockups lock in decisions. This is the core value proposition of the design process: invest early, save late.',
        key_concepts: ['double diamond', 'discovery phase', 'cost of rework', 'stakeholder management'],
        score_keywords: ['research', 'cheaper', 'wrong solution', 'rework'],
      },
    ],
  },

  // ── Digital Marketing ─────────────────────────────────────────────────────
  digital_marketing: {
    label: 'Digital Marketing',
    icon: '📈',
    careerPaths: ['Digital Marketer', 'Growth Hacker', 'SEO Specialist', 'Content Strategist'],
    resources: [
      { label: 'Google Digital Garage', url: 'https://learndigital.withgoogle.com/', icon: '🔍' },
      { label: 'HubSpot Academy', url: 'https://academy.hubspot.com/', icon: '🎓' },
      { label: 'Moz SEO Learning Center', url: 'https://moz.com/learn/seo', icon: '📊' },
      { label: 'Neil Patel Blog', url: 'https://neilpatel.com/blog/', icon: '📝' },
    ],
    quizQuestions: [
      {
        id: 'rb_dm_q1', skillId: 'seo_basics', skillName: 'SEO Fundamentals',
        concept: 'On-Page SEO & Search Intent',
        difficulty: 'basic',
        question: 'Which factor has the GREATEST impact on a page\'s Google ranking for a given keyword?',
        type: 'multiple_choice',
        options: [
          'A) High-quality content that satisfies the user\'s search intent, supported by authoritative backlinks',
          'B) Including the keyword in every sentence of the page',
          'C) Having the exact keyword in the domain name',
          'D) Publishing new content every day regardless of quality',
        ],
        correct: 'A) High-quality content that satisfies the user\'s search intent, supported by authoritative backlinks',
        explanation: 'Google\'s core algorithm values: (1) relevance — does the content actually answer what the user was searching for? and (2) authority — do other trusted sites link to this page? Keyword stuffing is penalized. Domain names have minimal impact. Quantity without quality is ignored.',
        key_concepts: ['search intent', 'backlinks', 'content quality', 'Google algorithm'],
        score_keywords: ['intent', 'backlinks', 'quality', 'authority'],
      },
      {
        id: 'rb_dm_q2', skillId: 'paid_advertising', skillName: 'Paid Advertising',
        concept: 'ROAS & Campaign Optimization',
        difficulty: 'moderate',
        question: 'Your Google Ads campaign has a ROAS of 2.5. The industry benchmark is 4.0. What should you investigate first?',
        type: 'multiple_choice',
        options: [
          'A) Audience targeting and keyword match types — you may be attracting low-intent traffic',
          'B) Increase the daily budget to get more impressions',
          'C) Switch to a different ad platform entirely',
          'D) Change the ad copy color scheme',
        ],
        correct: 'A) Audience targeting and keyword match types — you may be attracting low-intent traffic',
        explanation: 'ROAS = Revenue/Ad Spend. Below-benchmark ROAS usually means: (1) wrong audience (broad match keywords attracting irrelevant searches), (2) poor landing page conversion, (3) weak ad-to-landing-page message match. Increasing budget on a poor ROAS campaign just loses more money.',
        key_concepts: ['ROAS', 'keyword match types', 'audience targeting', 'conversion rate'],
        score_keywords: ['roas', 'targeting', 'keyword', 'intent'],
      },
      {
        id: 'rb_dm_q3', skillId: 'email_marketing', skillName: 'Email Marketing',
        concept: 'Segmentation & Personalization',
        difficulty: 'advanced',
        question: 'An e-commerce email campaign shows 14% open rate (industry average: 21%). The subject lines are personalized with first names. What is the most likely root cause?',
        type: 'multiple_choice',
        options: [
          'A) Poor list hygiene and low sender reputation — inactive subscribers and spam reports hurt deliverability',
          'B) Subject lines are too short — longer subjects get more clicks',
          'C) Emails are sent at the wrong time of day',
          'D) Not enough images in the email body',
        ],
        correct: 'A) Poor list hygiene and low sender reputation — inactive subscribers and spam reports hurt deliverability',
        explanation: 'Low open rates are often a deliverability issue: emails landing in spam instead of the inbox. Causes: (1) inactive subscribers dragging down engagement signals, (2) spam complaints, (3) not authenticating with SPF/DKIM. Clean inactive subscribers every 6 months. Name personalization alone doesn\'t fix deliverability.',
        key_concepts: ['email deliverability', 'list hygiene', 'sender reputation', 'spam filters'],
        score_keywords: ['deliverability', 'list', 'hygiene', 'spam', 'reputation'],
      },
      {
        id: 'rb_dm_q4', skillId: 'content_strategy', skillName: 'Content Strategy',
        concept: 'Content Funnel Mapping',
        difficulty: 'practical',
        question: 'A SaaS company wants content to convert free trial users into paid subscribers. Which content type is most appropriate?',
        type: 'multiple_choice',
        options: [
          'A) Bottom-of-funnel content: case studies, ROI calculators, and comparison pages that address purchase objections',
          'B) Top-of-funnel content: educational blog posts about general industry trends',
          'C) Brand awareness content: viral social media posts and memes',
          'D) Mid-funnel content: "What is [product category]?" explainer videos',
        ],
        correct: 'A) Bottom-of-funnel content: case studies, ROI calculators, and comparison pages that address purchase objections',
        explanation: 'Trial users are already aware (TOF) and considering (MOF) — they\'re at the bottom of funnel (BOF): decision stage. They need: social proof (case studies), proof of value (ROI calculators), and objection handling (comparison pages). TOF content is wasted on someone already trialing your product.',
        key_concepts: ['content funnel', 'BOFU', 'case studies', 'conversion optimization'],
        score_keywords: ['bottom', 'case study', 'roi', 'conversion', 'decision'],
      },
      {
        id: 'rb_dm_q5', skillId: 'analytics', skillName: 'Marketing Analytics',
        concept: 'Attribution Modelling',
        difficulty: 'real_world',
        question: 'A customer first discovers your brand via organic search, then sees a Facebook retargeting ad, then converts via email. Last-click attribution gives 100% credit to email. Why is this misleading?',
        type: 'multiple_choice',
        options: [
          'A) It ignores the role of earlier touchpoints (SEO, paid social) that initiated and nurtured the journey',
          'B) Email should never get credit for conversions since it targets existing users',
          'C) Last-click is only misleading for B2B businesses, not e-commerce',
          'D) It overvalues organic search instead of properly crediting email',
        ],
        correct: 'A) It ignores the role of earlier touchpoints (SEO, paid social) that initiated and nurtured the journey',
        explanation: 'Last-click attribution systematically underfunds upper-funnel channels (SEO, display) that initiate the journey. If you cut SEO based on this data, fewer users would enter the funnel. Multi-touch models (linear, time decay, data-driven) distribute credit more accurately across all touchpoints.',
        key_concepts: ['attribution modelling', 'last-click', 'multi-touch', 'customer journey'],
        score_keywords: ['attribution', 'touchpoint', 'funnel', 'credit'],
      },
    ],
  },
};

// ── Chip / VLSI Design (niche — no standard domain ID, matched by keyword) ─
const CHIP_DESIGN_QUIZ = [
  {
    id: 'rb_chip_q1', skillId: 'digital_logic', skillName: 'Digital Logic Design',
    concept: 'Combinational vs Sequential Logic',
    difficulty: 'basic',
    question: 'What is the fundamental difference between combinational and sequential logic circuits?',
    type: 'multiple_choice',
    options: [
      'A) Sequential logic has memory (depends on past state); combinational logic output depends only on current inputs',
      'B) Combinational logic uses flip-flops; sequential logic uses gates only',
      'C) Sequential logic is faster because it does not need clocking',
      'D) They are identical — "sequential" just means the gates are arranged in a sequence',
    ],
    correct: 'A) Sequential logic has memory (depends on past state); combinational logic output depends only on current inputs',
    explanation: 'Combinational: output = f(current inputs) — no memory. Examples: AND/OR gates, MUX, ALU. Sequential: output = f(current inputs + past state) — uses flip-flops as memory. Examples: registers, counters, FSMs. This distinction is fundamental to digital design.',
    key_concepts: ['combinational logic', 'sequential logic', 'flip-flops', 'state'],
    score_keywords: ['memory', 'state', 'flip-flop', 'sequential'],
  },
  {
    id: 'rb_chip_q2', skillId: 'hdl_coding', skillName: 'HDL — Verilog/VHDL',
    concept: 'Blocking vs Non-Blocking Assignments',
    difficulty: 'moderate',
    question: 'In Verilog, what is the difference between blocking (=) and non-blocking (<=) assignments in an always block?',
    type: 'multiple_choice',
    options: [
      'A) Blocking executes sequentially (like software); non-blocking schedules updates to happen simultaneously at end of time step — use <= for flip-flops',
      'B) Blocking is for combinational logic only; non-blocking is for sequential logic only — they are interchangeable',
      'C) Non-blocking (<=) is faster at synthesis; blocking (=) is for simulation only',
      'D) There is no functional difference in synthesized hardware',
    ],
    correct: 'A) Blocking executes sequentially (like software); non-blocking schedules updates to happen simultaneously at end of time step — use <= for flip-flops',
    explanation: 'Critical Verilog rule: use <= (non-blocking) in clocked always blocks (flip-flops) to model simultaneous register updates. Use = (blocking) in combinational always blocks. Mixing them incorrectly creates simulation/synthesis mismatches — a very common bug.',
    key_concepts: ['non-blocking assignment', 'blocking assignment', 'Verilog', 'RTL coding'],
    score_keywords: ['non-blocking', 'simultaneous', 'flip-flop', 'clocked'],
  },
  {
    id: 'rb_chip_q3', skillId: 'timing_analysis', skillName: 'Static Timing Analysis',
    concept: 'Setup & Hold Time Violations',
    difficulty: 'advanced',
    question: 'A path in your design has a setup slack of -200ps. Which action correctly fixes this timing violation?',
    type: 'multiple_choice',
    options: [
      'A) Reduce the combinational path delay: resize gates, use faster cells, or restructure logic to shorten the critical path',
      'B) Increase the clock period — a slower clock always fixes setup violations',
      'C) Add a buffer on the clock path to slow the clock edge',
      'D) Fix the hold violation first — setup and hold are always coupled',
    ],
    correct: 'A) Reduce the combinational path delay: resize gates, use faster cells, or restructure logic to shorten the critical path',
    explanation: 'Setup slack = (clock period) - (data path delay) - (setup time). Negative slack = data arrives too late. Fix: (1) make data path faster (upsize gates, use faster library cells, restructure logic), or (2) increase clock period. Buffers on clock slow it further and make setup worse. Setup and hold violations are independent.',
    key_concepts: ['setup slack', 'critical path', 'timing closure', 'cell sizing'],
    score_keywords: ['setup', 'slack', 'critical path', 'delay', 'faster'],
  },
  {
    id: 'rb_chip_q4', skillId: 'physical_design', skillName: 'Physical Design',
    concept: 'Floorplanning & Power Grid',
    difficulty: 'practical',
    question: 'During floorplanning of an ASIC, where should high-activity clock and power circuits (PLL, power domains) be placed?',
    type: 'multiple_choice',
    options: [
      'A) Near the center with dedicated power rings — minimizes IR drop and clock distribution skew across the chip',
      'B) At the chip corners — corners have the best cooling and are easiest to route',
      'C) Near I/O pads — reduces the distance for external connections',
      'D) Placement does not matter for power/clock — the router handles it automatically',
    ],
    correct: 'A) Near the center with dedicated power rings — minimizes IR drop and clock distribution skew across the chip',
    explanation: 'PLLs and clock roots near center minimize maximum clock tree wire length → lower skew. Power domains near center reduce worst-case IR drop (voltage droop from power supply resistance). Corner placement maximizes distance to half the chip. This is a standard floorplanning guideline.',
    key_concepts: ['floorplanning', 'IR drop', 'clock skew', 'PLL placement'],
    score_keywords: ['center', 'ir drop', 'skew', 'power ring'],
  },
  {
    id: 'rb_chip_q5', skillId: 'eda_tools', skillName: 'EDA Tools & ASIC Flow',
    concept: 'RTL-to-GDSII Flow',
    difficulty: 'real_world',
    question: 'In the ASIC design flow, what does the "sign-off" stage verify before tape-out?',
    type: 'multiple_choice',
    options: [
      'A) Timing (STA), power (IR drop/EM), physical verification (DRC/LVS), and functional equivalence (formal verification)',
      'B) Only that the Verilog simulation passes all test vectors',
      'C) Only physical DRC checks — timing is fixed during synthesis',
      'D) Sign-off is optional for FPGAs but required for ASICs',
    ],
    correct: 'A) Timing (STA), power (IR drop/EM), physical verification (DRC/LVS), and functional equivalence (formal verification)',
    explanation: 'Tape-out is irreversible — you cannot patch silicon. Sign-off checklist: (1) STA: all paths meet timing at all process/voltage/temperature corners, (2) Power: IR drop, electromigration, (3) DRC: design rule check (manufacturing rules), (4) LVS: layout vs schematic match, (5) Formal: RTL = netlist = layout logically.',
    key_concepts: ['tape-out', 'sign-off', 'DRC', 'LVS', 'STA', 'formal verification'],
    score_keywords: ['sta', 'drc', 'lvs', 'timing', 'sign-off'],
  },
];

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Check if a domain has predefined quiz questions
 */
function hasQuiz(domainId, goalText = '') {
  if (RULE_BASE[domainId]) return true;
  // Check by goal text for niche domains
  const lower = (goalText || '').toLowerCase();
  if (/chip|vlsi|rtl|verilog|vhdl|fpga|asic|semiconductor|hardware design/.test(lower)) return true;
  return false;
}

/**
 * Get exactly 5 predefined quiz questions for a domain
 * Returns null if domain not found in rule base
 */
function getQuiz(domainId, goalText = '') {
  const lower = (goalText || '').toLowerCase();

  // Check for chip/VLSI
  if (/chip|vlsi|rtl|verilog|vhdl|fpga|asic|semiconductor|hardware design/.test(lower)) {
    return CHIP_DESIGN_QUIZ.slice(0, 5);
  }

  const entry = RULE_BASE[domainId];
  if (!entry) return null;

  return (entry.quizQuestions || []).slice(0, 5);
}

/**
 * Get career metadata for a domain
 */
function getCareerMeta(domainId, goalText = '') {
  const lower = (goalText || '').toLowerCase();
  if (/chip|vlsi|rtl|verilog|vhdl|fpga|asic|semiconductor/.test(lower)) {
    return {
      label: 'Chip Design / VLSI',
      icon: '🔬',
      careerPaths: ['VLSI Design Engineer', 'RTL Designer', 'Physical Design Engineer', 'Verification Engineer'],
      resources: [
        { label: 'Verilog HDL Guide', url: 'https://www.asic-world.com/verilog/veritut.html', icon: '📖' },
        { label: 'NPTEL Digital Circuits', url: 'https://nptel.ac.in/', icon: '🎓' },
        { label: 'EDAPlayground', url: 'https://www.edaplayground.com/', icon: '⚙️' },
        { label: 'ChipVerify', url: 'https://www.chipverify.com/', icon: '✅' },
      ],
    };
  }
  return RULE_BASE[domainId] || null;
}

export default { hasQuiz, getQuiz, getCareerMeta, RULE_BASE };
