0code Gaming Product Requirements Document (PRD)

REFINED 2-WEEK MVP SCOPE
Game Type: 1-Minute Duolingo-style Code Comprehension
Types of Questions (from uploaded Jupyter notebooks)
"What does this syntax mean?" (basic concept identification)


"Is this the correct snippet?" (True/False or Yes/No)


"Rearrange the code" (drag/drop or button-click reordering)


"Fill in the blanks" (in later stage — defer in MVP if needed)


UnLimited questions within limited time of 60 seconds that user can attempt

📂 Admin Panel (File Uploader + Parser)
Upload .ipynb files


Extract:


Code blocks (cell-by-cell)


Markdown cells (definitions, titles)


Use AI (OpenAI API or similar) to:


Generate Q&A pairs of type: "What does this do?", "What’s the output?", "Is this syntactically correct?", "Reorder lines"


Classify snippets by topics (functions, loops, pandas, etc.)


OCR for screenshots ❌ Out of MVP scope

📊 Game Mechanics
60-second timer per session


Mix of 2–3 question types per round (match the following, rearrange, Fill in the banks)


Points based on correctness


End screen: Score summary


High level approach:
You use GPT-style APIs (e.g., OpenAI/Gemini) for Q&A generation from notebooks


Game frontend is limited to 2–3 interaction types:


Click to answer “What does this mean?”


Button reorder for code lines


True/False for code validity




Suggested 2-Week Sprint Breakdown
Week 1
Backend
Set up file upload API (accept .ipynb)


Parse notebook: extract code & markdown


Send chunks to GPT for Q&A generation


Store tagged Q&A in DB


Frontend
Build timer-based game UI shell (start/stop/replay)


Build “What does this syntax mean?” question UI


Basic scoreboard page


Team Sync
Daily review of extracted questions for quality check


Collect 10 sample notebooks for testing



Week 2
Frontend
Add “Rearrange the code” UI


Add “Is this snippet valid?” UI


Integrate question types randomly into 1-minute session


Score + feedback view at end



Backend
Add simple topic tags (loop, function, pandas) to parsed questions


Optimize GPT prompt template for better Q/A generation


QA & Launch
Test 5 users end-to-end


Minor visual polish


Deploy to staging or demo environment



📌 Final Notes
This design is highly modular, so future features (like fill-in-the-blank or progressive difficulty) can be added easily post-MVP.


Think of question creation as “micro challenges” not “full coding problems”.


Tech stack -
frontend : react
backend : node 

create docs in /Users/balajiv/Documents/coderepos/agentic_mesh/setup_1/WIP/docs