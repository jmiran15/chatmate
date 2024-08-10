import { ScrapedWebsite } from "./actions.server";

export const extractLinksUserPrompt = ({
  baseUrl,
  content,
}: {
  baseUrl: string;
  content: string;
}) => `Given the following website content, extract all links that are relevant to understanding the product's pricing, features, pros, and cons. Only include links that are part of the ${baseUrl} domain. Do not include links like privacy policies, terms of service, or other non-product related links. Return the result as a JSON array of strings.

Content:
${content}`;

export const extractInfoUserPrompt = ({
  websites,
}: {
  websites: ScrapedWebsite[];
}) => `Given the following scraped website content from multiple pages, extract all relevant information needed to write features, pricing, pros, and cons sections about the product. Use direct quotes from the provided content and do not summarize or paraphrase. Include the source URL for each piece of information.

Content:
${websites
  .map((website) => `[Source: ${website.url}]\n${website.content}`)
  .join("\n\n")}

Return the result as a JSON object with the following structure:
{
  "features": [{"quote": "...", "source": "..."}],
  "pricing": [{"quote": "...", "source": "..."}],
  "pros": [{"quote": "...", "source": "..."}],
  "cons": [{"quote": "...", "source": "..."}]
}`;

export const combineExtractedInfoUserPrompt = ({
  result1,
  result2,
}: {
  result1: string;
  result2: string;
}) => `Combine and refine the following two sets of extracted product information:

Set 1: ${result1}

Set 2: ${result2}

Return the combined and refined result as a JSON object with the same structure as the input.`;

export const generateBlogSystemPrompt = () =>
  'We are working on creating a blog post for our web app - for the purposes of SEO and reaching more users organically - who are showing buyer intent. We are working on BoFu blog content - which is bottom of the funnel content - usually for users who are one step away from a final purchase. Our web app is called Chatmate.so - it is an AI customer support platform for businesses on the web.\n\nMore specifically - we will be working on an “alternatives list” blog.\n\nThis type of blog typically is about a list of X (some number) products/services that are alternatives to another product. \n\nWe will call the main product the “root” product. The “root” product is not necessarily OUR product, just a competitor to our product. That way, when a user searches organically for “[root product] alternatives” - they can find our blog post of a useful list of alternatives. \n\nAn important part of this style of blog post is that we must show OUR product as the MAIN and BEST alternative to the root product. The blog post must be biased towards OUR product - since at the end of the day, the blog post’s objective is to convert users to our product, by showing them WHY they should get an alternative to the root product AND WHY the best alternative is OUR product. \n\nWe will be following a simple style for the sections. The style is based on a successful “alternatives list” blog format used by the company ClickUp. \n\nTheir “alternatives list” blog posts from ClickUp follow the following format (somewhat; a real blog post from ClickUp’s website has been included in this prompt):\n- Intro:\n    - Smooth user flow into blog post… discuss WHY they would need an alternative\n    - Describe the root product “what is [root]?”\n    - Pricing of the root product\n    - Paragraph leading into the point of WHY “Doesn’t sound too bad, right? …”\n    - Why do you need a [root] alternative?\n- Main sections (first product of course is ours … with biased content and encouragement) + CTA at the end of the section?\n    - Alternative product’s name (as heading)\n    - Screenshot of the alternative product landing page\n    - Short description (regular text)\n    - Features section (bullet points)\n    - OPTIONAL – [root product] vs [alternative] –short paragraph  + some bullets\n    - Pros section (bullets)\n    - Cons section (bullets)\n    - Pricing (bullets)\n- Concluding section: “… with [root] alternatives”\n    - Root for our product\n    - Why our product vs. the other alternatives\n    - CTA for our product\n\nHere is an example introduction from a ClickUp alternatives list blog post:\n```md\n-----------------------------------------------\n\n15 Best Todoist Alternatives & Competitors in 2024\n==================================================\n\n[![Sudarshan Somanathan ClickUp Blog Author Image](https://clickup.com/blog/wp-content/uploads/2024/03/Sudarshan-S.png)\\\n\\\nSudarshan Somanathan\\\n\\\nHead of Content](https://clickup.com/blog/author/sudarshan/)\n\nAugust 6, 2024\n\n15min read\n\n*   [](https://twitter.com/share?url=https://clickup.com/blog/best-todoist-alternatives/&text=15%20Best%20Todoist%20Alternatives%20%26%23038%3B%20Competitors%20in%202024&via=clickup)\n    \n*   [](https://www.linkedin.com/shareArticle?url=https://clickup.com/blog/best-todoist-alternatives/&title=15%20Best%20Todoist%20Alternatives%20%26%23038%3B%20Competitors%20in%202024)\n    \n*   [](https://www.facebook.com/sharer.php?u=https://clickup.com/blog/best-todoist-alternatives/)\n    \n\n_Looking for the best_ _Todoist alternatives__?_\n\nTodoist is no stranger to project management; it’s been alive and kicking since 2007!\n\n…But as one of the **veteran** organizational apps, wouldn’t it be a little rusty by now?\n\nWhile its to-do list feature has been updated to accommodate our modern (and frantic) work pace, its age still shows.\n\nOverall, Todoist’s [project management software](https://clickup.com/blog/free-project-management-software/)\n features are pretty basic compared to other tools and it requires a lot of add-ons to keep up with daily processes. And since Todoist is better suited for simple to-do lists rather than managing projects, tasks, and workflows, it’s not uncommon for teams to seek out more dynamic and fresher Todoist alternatives.\n\nRead along for a deep dive into the limitations of Todoist. Plus, a breakdown of its 15 best alternatives including pros, cons, pricing, reviews, and more!\n\n*   [Top 15 Todoist Alternatives & Competitors in 2024](https://clickup.com/blog/best-todoist-alternatives/#2-top-15-todoist-alternatives-amp-competitors-in-2024)\n    *   [1\\. ClickUp](https://clickup.com/blog/best-todoist-alternatives/#3-1-clickup)\n        \n    *   [2\\. Tick Tick](https://clickup.com/blog/best-todoist-alternatives/#9-2-tick-tick)\n        \n    *   [3\\. Trello](https://clickup.com/blog/best-todoist-alternatives/#15-3-trello)\n        \n    *   [4\\. nTask](https://clickup.com/blog/best-todoist-alternatives/#21-4-ntask)\n        \n    *   [5\\. Asana](https://clickup.com/blog/best-todoist-alternatives/#27-5-asana)\n        \n    *   [6\\. Notion](https://clickup.com/blog/best-todoist-alternatives/#33-6-notion-)\n        \n    *   [7\\. OmniFocus](https://clickup.com/blog/best-todoist-alternatives/#39-7-omnifocus)\n        \n    *   [8\\. Any.do](https://clickup.com/blog/best-todoist-alternatives/#45-8-anydo)\n        \n    *   [9\\. Google Keep](https://clickup.com/blog/best-todoist-alternatives/#51-9-google-keep)\n        \n    *   [10\\. Meistertask](https://clickup.com/blog/best-todoist-alternatives/#57-10-meistertask)\n        \n    *   [11\\. Azendoo](https://clickup.com/blog/best-todoist-alternatives/#63-11-azendoo)\n        \n    *   [12\\. Zoho Projects](https://clickup.com/blog/best-todoist-alternatives/#69-12-zoho-projects)\n        \n    *   [13\\. Teamwork Projects](https://clickup.com/blog/best-todoist-alternatives/#75-13-teamwork-projects-)\n        \n    *   [14\\. Redbooth](https://clickup.com/blog/best-todoist-alternatives/#81-14-redbooth-)\n        \n    *   [15\\. Microsoft Planner](https://clickup.com/blog/best-todoist-alternatives/#87-15-microsoft-planner)\n        \n\nWhat Is Todoist?\n----------------\n\n![todoist product example](data:image/svg+xml,%3Csvg%20xmlns=\'http://www.w3.org/2000/svg\'%20viewBox=\'0%200%201037%20638\'%3E%3C/svg%3E)\n\nvia [Todoist](https://todoist.com/)\n\nTodoist is a [task management tool](https://clickup.com/blog/task-management-software/)\n that allows you to organize, plan, and collaborate on lists and projects. Its clean and intuitive interface makes it an attractive software option for individuals and small teams alike. Some of its best features include:\n\n*   Assign tasks to yourself or your team\n*   Recurring task due dates\n*   Deadline reminders\n*   Progress tracking\n\nPlus, Todoist is relatively affordable, especially for personal use. 💸\n\nIn addition to a free version for basic use, Todoist offers two paid plans for additional functionality:\n\n*   **Todoist Pro**: $4 per month for individual users\n*   **Todoist Business**: $6 per user, per month for teams\n\nDoesn’t sound too bad, right? But when the going gets rough—AKA, when you’re dealing with more complex projects—Todoist might not cut it, and you’ll be back looking for a solution with features that go beyond general task management.\n\nSummarize this article with AI ClickUp Brain not only saves you precious time by instantly summarizing articles, it also leverages AI to connect your tasks, docs, people, and more, streamlining your workflow like never before. Summarize article\n\n![ClickUp Brain](data:image/svg+xml,%3Csvg%20xmlns=\'http://www.w3.org/2000/svg\'%20viewBox=\'0%200%200%200\'%3E%3C/svg%3E)\n\n![Avatar of person using AI](data:image/svg+xml,%3Csvg%20xmlns=\'http://www.w3.org/2000/svg\'%20viewBox=\'0%200%200%200\'%3E%3C/svg%3E) Summarize this article for me please\n\nWant to save even more time? [Try ClickUp Brain free](https://app.clickup.com/signup?product=ai&ai=true)\n\nWhy Do You Need a Todoist Alternative?\n--------------------------------------\n\nTodoist is a _good_ task management app—but not great_._ 👀\n\nHere are a few big reasons why:\n\n*   There’s no built-in time-tracking feature to manage your productivity while completing tasks.\n*   You can’t create custom statuses to align with and manage your workflows.\n*   Many features in Todoist’s paid plans are offered for free with other software.\n*   It’s not as effective for work that requires more than a set of lists to complete.\n*   The free version is [now limited](https://zapier.com/blog/free-todoist-account-five-project-limit/)\n     to 5 active projects…the old limit was 80. 😐\n\n…and more. 😳\n\nNo need to panic though—we come bearing good news!\n\nWe’ve carefully curated a list of the top Todoist alternatives for any team! Let this list guide you on your search for the best and most productive project management app for any team. 🙌🏼\n\nSummarize this article with AI ClickUp Brain not only saves you precious time by instantly summarizing articles, it also leverages AI to connect your tasks, docs, people, and more, streamlining your workflow like never before. Summarize article\n\n![ClickUp Brain](data:image/svg+xml,%3Csvg%20xmlns=\'http://www.w3.org/2000/svg\'%20viewBox=\'0%200%200%200\'%3E%3C/svg%3E)\n\n![Avatar of person using AI](data:image/svg+xml,%3Csvg%20xmlns=\'http://www.w3.org/2000/svg\'%20viewBox=\'0%200%200%200\'%3E%3C/svg%3E) Summarize this article for me please\n\nWant to save even more time? [Try ClickUp Brain free](https://app.clickup.com/signup?product=ai&ai=true)\n\nTop 15 Todoist Alternatives & Competitors in 2024\n-------------------------------------------------\n\nLuckily, there are a ton of project management and [collaboration tools](https://clickup.com/blog/online-collaboration-tools/)\n on the market these days—it’s a huge industry. So it’s not a matter of _**if**_ you’ll find a Todoist alternative, but _**when**_.\n\nWith so many options to pick from, the search for your team’s best solution can be time-consuming, to say the least. Rather than getting bogged down by decision fatigue or cross-referencing software features over your lunch break—let us handle the heavy lifting for you.\n\nHere are the best 15 Todoist alternatives for teams of any size, budget, or industry.\n```\nIn the above example the "root" product was "Todoist" and "OUR" product would have been ClickUp, which is shown as the first alternative. \n\nHere is an example of the first/main section of the blog post (right after the intro) - which shows and roots for OUR product. Following the same example blog post as above, we have:\n```md\n### 1\\. ClickUp\n\n![Optimize your workflow with ClickUp\'s customizable stages and statuses](https://clickup.com/blog/wp-content/uploads/2024/05/ClickUp-Task-Management.gif)\n\n[Manage Tasks in ClickUp](https://clickup.com/features/tasks)\n\nOptimize your workflow with ClickUp’s customizable stages and statuses\n\nOrganize and visualize tasks your way in [ClickUp](https://clickup.com)\n—a task management platform designed to bring teams and work together in one place. Use ClickUp Reminders to create notifications for your team in seconds. Reminders in ClickUp are easy to change, attach files, comment, update, and customize.\n\nAdditionally, ClickUp makes it easy to manage your [notifications](https://clickup.com/manage-your-notifications)\n so you can view, clear, react, and reply from any device!\n\n#### Features\n\n*   **[To-Do List Templates](https://clickup.com/blog/to-do-list-templates/)\n    :** ClickUp’s ready-to-use templates can be personalized to streamline your workflow. Whether it’s a straightforward [project plan](https://clickup.com/blog/project-plan/)\n     or a comprehensive task list, or even an onboarding checklist for team members, our templates facilitate a quick start.\n*   **[ClickUp Docs](https://clickup.com/features/docs)\n    **: Create organized, collaborative, and easily manageable to-do lists.\n*   **[ClickUp Tasks](https://clickup.com/features/tasks)\n    :** With our robust task management tool, planning, organizing, and collaborating on any project becomes effortless and can be tailored to suit every requirement.\n*   **List View:** Develop concise, multi-purpose to-do lists to conveniently manage your thoughts and tasks from any location, ensuring you never miss a thing.\n*   **[Bi-directional Linking](https://clickup.com/blog/bidirectional-linking/)\n    :** Use ClickUp’s bidirectional linking function to interlink all your Tasks for easy navigation between them.\n*   **[ClickUp Notepad](https://clickup.com/features/notepad)\n    :** Instantly note down your tasks, format with rich editing tools, and convert notes into trackable tasks accessible from any place.\n*   **[ClickUp Brain](https://clickup.com/ai)\n    :** Use ClickUp’s AI assistant to generate tasks, summarize notes, and craft to-do lists.\n*   **Available Platforms:** (Android, iPhone, iPad, Windows, macOS, Linux, Web)\n\n![Managing a to do list in ClickUp with Task Checklist](data:image/svg+xml,%3Csvg%20xmlns=\'http://www.w3.org/2000/svg\'%20viewBox=\'0%200%20934%20620\'%3E%3C/svg%3E)\n\nCreate clear, multi-functional to-do lists to easily manage your ideas and work from anywhere so you never forget anything again\n\n#### Pros\n\n*   Using AI text can be converted into trackable tasks in [ClickUp Docs](https://clickup.com/features/docs)\n    \n*   Over [1,000 integrations](https://clickup.com/integrations)\n     with other work tools and apps\n*   Available on the [ClickUp mobile app](https://clickup.com/download)\n    \n\n#### Cons\n\n*   The level of customizability and the number of features available may lead to a learning curve\n\n#### Pricing\n\nClickUp has multiple pricing plans:\n\n*   **Free Forever**\n*   **Unlimited**: $7 per user per month\n*   **Business**: $12 per user per month\n*   **Enterprise**: [Contact ClickUp](https://clickup.com/plans/enterprise)\n     for custom pricing\n*   **ClickUp AI** is available on all paid plans for $5 per Workspace member per month\n\n#### Ratings and reviews\n\n*   **G2**: 4.7/5 (1,400+reviews)\n*   **Capterra**: 4.7/5 (2,000+ reviews)\n```\nYou can see that the section is lengthy (when compared to the regular alternative sections) - and persuasive.\n\nHere is what a regular section should look like:\n```md\n### 2\\. Tick Tick\n\n![TickTick product example](data:image/svg+xml,%3Csvg%20xmlns=\'http://www.w3.org/2000/svg\'%20viewBox=\'0%200%201400%20660\'%3E%3C/svg%3E)\n\nvia [TickTick](https://ticktick.com/?language=en_US)\n\nTick Tick has a few powerful task management abilities, which make it a quality contender as a Todoist alternative.\n\nBut if you’re looking for a tool that offers a free version with many useful features, you may have to look elsewhere.\n\n**_Compare [TickTick Vs Todoist](https://clickup.com/blog/ticktick-vs-todoist/)\n!_**\n\n#### Features\n\n*   Built-in [Pomodoro timer](https://clickup.com/blog/the-best-pomodoro-timer-apps/)\n    \n*   Convert emails into tasks\n*   “Plan my day” to help [prioritize tasks](https://clickup.com/blog/how-to-prioritize-your-work/)\n     for the day\n\n#### Pros\n\n*   Reminders for schedules along with location-based alerts\n*   Various calendar views\n*   Available for iOS (iPhone & iPad)and Android\n\n#### Cons\n\n*   No native calendar sync\n*   Limited integration options\n*   The free version is limited to only 99 tasks (we wish it was at least a round number 😏)\n\n#### Pricing\n\n*   Basic Plan can be upgraded to Premium Plan at $27.99 per year\n\n#### Customer ratings\n\n*   **Capterra:** 4.8/5 (80+ reviews)\n*   **G2:** 4.5/5 (80+ reviews)\n```\nYou will notice it has most of the same things as the main section, but it is much shorter, and more descriptive rather than persuasive. \n\nAnd finally, here is the conclusion:\n```md\nManage Tasks with Todoist Alternatives!\n---------------------------------------\n\nFinding a decent Todoist alternative doesn’t have to be a chore. 🧹\n\nAny of these 15 Todoist alternatives will offer the support, features, and functionality your team has been dreaming of. Especially one in particular—[ClickUp](https://clickup.com/download)\n. 🙂\n\n_Why?_ Tons of powerful [project management features](https://clickup.com/features)\n including unlimited tasks, [multiple project views](https://clickup.com/features/views)\n, [Checklists](https://clickup.com/features/task-checklists)\n, [automations](https://clickup.com/features/automations)\n, [time-tracking](https://clickup.com/features/project-time-tracking)\n, and more, all on [ClickUp’s Free Forever Plan](https://clickup.com/pricing)\n! 🤯\n\n![ClickUp views](data:image/svg+xml,%3Csvg%20xmlns=\'http://www.w3.org/2000/svg\'%20viewBox=\'0%200%201200%20746\'%3E%3C/svg%3E)\n\nSee the 15+ views in ClickUp to customize your workflow to your needs\n\nPlus, ClickUp is there for you every step of the way with hundreds of pre-built templates for every use case, over 1,000 integrations, and comprehensive support to help you use the platform in the most productive way possible.\n\n[Sign up for ClickUp today](https://clickup.com/)\n to take your to-dos to the next level!\n```\n\nYour task will be to generate an entire blog post, based on all of the information a user provides you with. \n\nThe user will provide you with information in JSON format, and you must respond in strictly markdown format. your output should be only the finalized blog post - properly formatted with markdown. You should make use of the markdown to make the blog post as readable and enjoyable for a user as possible!\n\nInformation will be provided to you in the following format:\n```json\n{\nrootProduct: {\nurl: string,\nscreenshotPath: string,\nextractedContent: string,\n}\n},\nourProduct: {\nurl: string,\nscreenshotPath: string,\nextractedContent: string,\n},\nalternativeProducts: [{\nurl: string,\nscreenshotPath: string,\nextractedContent: string,\n}]\n}\n```\nthe `extractedContent` string will be a stringified JSON of the following format:\n```\n{\n  "features": [{"quote": "...", "source": "..."}],\n  "pricing": [{"quote": "...", "source": "..."}],\n  "pros": [{"quote": "...", "source": "..."}],\n  "cons": [{"quote": "...", "source": "..."}]\n}\n```\nwhere "quote" is text that came directly from the source url.\n\nMake sure that you only extract/include things in your blog post IF they were in the provided contents. You are not allowed to make up any information. This is extremely important for things like features, pricing information, ratings, etc… If there are any clear mistakes - Google will interpret our blog post as unreliable and could penalize our search rankings.\n\nRegarding your tone, style of writing - you should use the same exact style as the ClickUp blog used. A good litmus test for your style of writing is that I should be able to append your generated section to the end of the ClickUp article and not have it sound out of place (apart from the fact that the content and products are different; of course!)\n\nSome extra notes:\n* The product descriptions should closely mirror the style and structure of the ClickUp example. It should consist of 3-5 sentences, separated by spaces, and provide a comprehensive introduction to the product.\n* The sections should end with the customer ratings and should not include a conclusion or summary paragraph. Please note that in our specific case, we have not provided the customer ratings, so you may exclude this section. Therefore your alternative product sections should end with the cons sub section.\n* It is extremely important that you match the tone, style, and structure of the ClickUp blog as closely as possible, treating it as a template to be followed rather than just an example for reference.\n* Review the ClickUp example multiple times before starting to write, to ensure a closer match in style and format.\n* Aim to make the section read as if it were written by the same author as the ClickUp blog, maintaining consistency in voice and presentation.\n\nYou must return the entire blog post - not something partial.\nMake sure everything is properly formatted in markdown. Do not add a ```md tag at the beginning or end. Only return the markdown contents.';

export const generateBlogUserPrompt = ({
  extractedSections,
}: {
  extractedSections: {
    url: string;
    screenshotUrl: string;
    extractedInfo: string;
  }[];
}) => {
  const prompt_pre = extractedSections.map((section) => ({
    url: section.url,
    screenshotPath: section.screenshotUrl,
    extractedContent: section.extractedInfo,
  }));

  const prompt = {
    rootProduct: prompt_pre[0],
    ourProduct: prompt_pre[1],
    alternativeProducts: prompt_pre.slice(2),
  };

  return JSON.stringify(prompt);
};
