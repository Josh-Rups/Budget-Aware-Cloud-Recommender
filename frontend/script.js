
document.addEventListener("DOMContentLoaded", () => {

    // =====================================================
    // ELEMENTS
    // =====================================================

    const screens = {
        describe: document.getElementById("describeScreen"),
        loading: document.getElementById("loadingScreen"),
        analysis: document.getElementById("analysisScreen"),
        results: document.getElementById("resultsScreen"),
        recommendation: document.getElementById("recommendationScreen"),
        // New screens
        review: document.getElementById("reviewScreen"),
        decision: document.getElementById("decisionScreen")
    };

    const appDescription = document.getElementById("appDescription");
    const budgetInput = document.getElementById("budget");
    const characterCount = document.getElementById("characterCount");
    const analyzeButton = document.getElementById("analyzeButton");
    const homeButton = document.getElementById("homeButton");
    const editRequestButton = document.getElementById("editRequestButton");
    const confirmButton = document.getElementById("confirmButton");
    const nextQuestionButton = document.getElementById("nextQuestionButton");
    const skipButton = document.getElementById("skipButton");
    const followupPanel = document.getElementById("followupPanel");
    const readyPanel = document.getElementById("readyPanel");
    const questionTitle = document.getElementById("questionTitle");
    const questionHelp = document.getElementById("questionHelp");
    const questionCounter = document.getElementById("questionCounter");
    const answerOptions = document.getElementById("answerOptions");
    const requestText = document.getElementById("requestText");
    const progressFill = document.getElementById("progressFill");
    const progressSteps = document.querySelectorAll(".workflow-step");
    // =====================================================
// USER PRIORITY ELEMENTS
// =====================================================

const priorityPanel =
    document.getElementById("priorityPanel");

const priorityOptions =
    document.querySelectorAll(".priority-option");

const priorityCount =
    document.getElementById("priorityCount");

const priorityHelp =
    document.getElementById("priorityHelp");

    // =====================================================
    // API CONFIGURATION
    // =====================================================

    const API_BASE_URL = "https://budget-aware-cloud-recommender.onrender.com";

    // =====================================================
    // STATE
    // =====================================================

    let currentQuestion = 0;
    let selectedAnswer = null;
    let questions = [];

    let generatedArchitectures = [];
    let architectureCosts = [];
    let architectureEvaluations = [];
    let recommendedArchitectureId = null;
    let aiRecommendationExplanation = null;
    let recommendationAssumptions = [];
    let tradeoffAnalysis = null;
    let conflictAnalysis = null;

   let requirements = {

    applicationType: null,

    users: null,

    trafficPattern: null,

    database: null,

    storage: null,

    availability: null,

    workloadType: null,

    managementPreference: null,

    infrastructureControl: null,

    userPriorities: [],

    region: "us-east-1",

    budget: null
};


    // =====================================================
    // SCREEN NAVIGATION
    // =====================================================

    function showScreen(screenName, stepNumber) {

        Object.values(screens).forEach(screen => {

            if (screen) {
                screen.classList.add("hidden");
            }
        });

        if (screens[screenName]) {
            screens[screenName].classList.remove("hidden");
        }

        updateProgress(stepNumber);

        if (screenName === "review") {
            populateReviewRequirements();
            populateReviewUpdatedRecommendation(null, reviewHasSuccessfulEdit);
            populateConflicts();
            populateTradeoffs();
        }

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }


    // =====================================================
    // PROGRESS
    // =====================================================

    function updateProgress(stepNumber) {

    // Progress percentages for 7 steps
    const percentages = [
        0,
        16.67,
        33.33,
        50,
        66.67,
        83.33,
        100
    ];

    if (progressFill) {
        progressFill.style.width =
            percentages[stepNumber - 1] + "%";
    }

    progressSteps.forEach((step, index) => {

        step.classList.remove("active", "complete");

        const circle = step.querySelector(".step-circle");

        const currentStep = index + 1;

        if (currentStep < stepNumber) {

            step.classList.add("complete");

            if (circle) {
                circle.textContent = "✓";
            }

        } else if (currentStep === stepNumber) {

            step.classList.add("active");

            if (circle) {
                circle.textContent = currentStep;
            }

        } else {

            if (circle) {
                circle.textContent = currentStep;
            }
        }
    });
}


    // =====================================================
    // CHARACTER COUNTER
    // =====================================================

    if (appDescription && characterCount) {

        appDescription.addEventListener("input", () => {

            characterCount.textContent =
                appDescription.value.length;
        });
    }


    // =====================================================
    // EXAMPLE BUTTONS
    // =====================================================

    document
        .querySelectorAll(".example-button")
        .forEach(button => {

            button.addEventListener("click", () => {

                const example =
                    button.dataset.example;

                appDescription.value =
                    example;

                characterCount.textContent =
                    example.length;

                appDescription.focus();
            });
        });


    // =====================================================
// TYPING PLACEHOLDER EFFECT
// =====================================================

function startPlaceholderTyping() {

    const textarea =
        document.getElementById("appDescription");

    if (!textarea) {
        return;
    }


    const exampleText =
        "Example: I want to build a student portal for about 2,000 users. It needs PostgreSQL, file storage, and standard availability.";


    let characterIndex = 0;

    textarea.placeholder = "";


    const typingInterval =
        setInterval(() => {

            // Stop if the user starts typing
            if (textarea.value.trim() !== "") {

                clearInterval(typingInterval);

                textarea.placeholder =
                    exampleText;

                return;
            }


            const typedText =
                exampleText.substring(
                    0,
                    characterIndex
                );


            // Blinking cursor
            const cursor =
                characterIndex % 2 === 0
                    ? "|"
                    : "";


            textarea.placeholder =
                typedText + cursor;


            characterIndex++;


            if (
                characterIndex >
                exampleText.length
            ) {

                clearInterval(
                    typingInterval
                );

                textarea.placeholder =
                    exampleText;
            }

        }, 35);
}

    // =====================================================
    // ANALYZE
    // =====================================================

    if (analyzeButton) {

        analyzeButton.addEventListener("click", () => {

            const description =
                appDescription.value.trim();

            if (!description) {

                alert(
                    "Please describe what you want to build."
                );

                appDescription.focus();

                return;
            }

            if (
                !budgetInput.value ||
                Number(budgetInput.value) <= 0
            ) {

                alert(
                    "Please enter your monthly AWS budget."
                );

                budgetInput.focus();

                return;
            }

           aiRecommendationExplanation = null;

                requirements.userPriorities = [];

                resetPrioritySelection();

                sendAnalysisRequest(description);
        });
    }

    
function updateAnalyzeButton() {
    const hasDescription =
        appDescription.value.trim().length > 0;

    const hasBudget =
        budgetInput.value.trim() !== "" &&
        Number.isFinite(Number(budgetInput.value)) &&
        Number(budgetInput.value) > 0;

    analyzeButton.disabled =
        !(hasDescription && hasBudget);
}

appDescription.addEventListener(
    "input",
    updateAnalyzeButton
);

budgetInput.addEventListener(
    "input",
    updateAnalyzeButton
);

updateAnalyzeButton();



    // =====================================================
    // BEDROCK REQUIREMENT ANALYSIS
    // =====================================================

    async function sendAnalysisRequest(description) {

        showScreen("loading", 2);

        const loadingMessage =
            document.getElementById("loadingMessage");

        const loadingProgress =
            document.getElementById("loadingProgress");


        if (loadingMessage) {

            loadingMessage.textContent =
                "Analyzing your application with AI...";
        }


        if (loadingProgress) {

            loadingProgress.style.width =
                "45%";
        }


        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/api/analyze`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            description: description,
                            budget: Number(
                                budgetInput.value
                            )
                        })
                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Backend returned status " +
                    response.status
                );
            }


            if (loadingProgress) {

                loadingProgress.style.width =
                    "80%";
            }


            const data =
                await response.json();

 
            console.log(
                "AI analysis:",
                data
            );


            requirements = {

                applicationType:
                    data.application_type,

                users:
                    data.expected_users,

                trafficPattern:
                    data.traffic_pattern,

                database:
                    data.database,

                storage:
                    data.storage_required === null
                        ? null
                        : data.storage_required
                            ? "Required"
                            : "Not required",

                availability:
                    data.availability,

                workloadType:
                    data.workload_type,

                managementPreference:
                    data.management_preference,

                infrastructureControl:
                    data.infrastructure_control,

                region:
                    data.region ||
                    "us-east-1",

                budget:
                    data.budget
            };


            if (loadingProgress) {

                loadingProgress.style.width =
                    "100%";
            }


            displayAnalysis(description);


        } catch (error) {

            console.error(
                "Analysis request failed:",
                error
            );

            alert(
                "Could not analyze the application. Check that the backend is running."
            );

            showScreen("describe", 1);
        }
    }


    // =====================================================
    // DISPLAY ANALYSIS
    // =====================================================

    function displayAnalysis(description) {

        showScreen("analysis", 3);

        if (requestText) {

            requestText.textContent =
                description;
        }

        refreshRequirementCards();


        const budgetRequirement =
            document.getElementById(
                "budgetRequirement"
            );


        if (budgetRequirement) {

            budgetRequirement.textContent =
                "$" +
                Number(
                    requirements.budget
                ).toLocaleString() +
                " / month";
        }
    const budgetRequirementStatus =
    document.getElementById(
        "budgetRequirementStatus"
    );

if (budgetRequirementStatus) {

    budgetRequirementStatus.textContent =
        "✓ Entered";

    budgetRequirementStatus.classList.remove(
        "needs-input"
    );

    budgetRequirementStatus.classList.add(
        "detected"
    );
}
        



        buildQuestions();
    }


    // =====================================================
    // REQUIREMENT CARD
    // =====================================================

    function setRequirement(
        valueId,
        statusId,
        value
    ) {

        const valueElement =
            document.getElementById(valueId);

        const statusElement =
            document.getElementById(statusId);


        if (
            !valueElement ||
            !statusElement
        ) {

            return;
        }


        if (
            value !== null &&
            value !== undefined &&
            value !== ""
        ) {

            valueElement.textContent =
                value;

            statusElement.textContent =
                "✓ Detected";

            statusElement.classList.add(
                "detected"
            );

        } else {

            valueElement.textContent =
                "Not specified";

            statusElement.textContent =
                "Needs input";

            statusElement.classList.remove(
                "detected"
            );
        }
    }


    // =====================================================
    // REGION
    // =====================================================

    function setRegionRequirement() {

        const valueElement =
            document.getElementById(
                "regionRequirement"
            );

        const statusElement =
            document.getElementById(
                "regionStatus"
            );


        if (
            !valueElement ||
            !statusElement
        ) {

            return;
        }


        valueElement.textContent =
            requirements.region ||
            "us-east-1";
            
        statusElement.textContent =
            "Default";

        statusElement.classList.remove(
            "detected"
        );
    }


    // =====================================================
    // REFRESH REQUIREMENTS
    // =====================================================

    function refreshRequirementCards() {

        setRequirement(
            "applicationType",
            "applicationStatus",
            requirements.applicationType
        );

        setRequirement(
            "expectedUsers",
            "usersStatus",
            requirements.users !== null
                ? Number(
                    requirements.users
                ).toLocaleString()
                : null
        );

        setRequirement(
            "trafficRequirement",
            "trafficStatus",
            requirements.trafficPattern
        );

        setRequirement(
            "databaseRequirement",
            "databaseStatus",
            requirements.database
        );

        setRequirement(
            "storageRequirement",
            "storageStatus",
            requirements.storage
        );

        setRequirement(
            "availabilityRequirement",
            "availabilityStatus",
            requirements.availability
        );

        setRegionRequirement();
    }


    // =====================================================
    // FOLLOW-UP QUESTIONS
    // =====================================================

    function buildQuestions() {

        questions = [];


        if (!requirements.applicationType) {

            questions.push({

                key: "applicationType",

                title:
                    "What type of application are you building?",

                help:
                    "Choose the option that best describes your application.",

                options: [
                    "Web application",
                    "E-commerce",
                    "API / Backend",
                    "Data processing",
                    "Not sure"
                ]
            });
        }


        if (!requirements.users) {

            questions.push({

                key: "users",

                title:
                    "How many users do you expect?",

                help:
                    "Choose the closest estimate.",

                options: [
                    "Under 1,000",
                    "1,000 – 5,000",
                    "5,000 – 20,000",
                    "More than 20,000",
                    "Not sure"
                ]
            });
        }


        if (!requirements.trafficPattern) {

            questions.push({

                key: "trafficPattern",

                title:
                    "What traffic pattern do you expect?",

                help:
                    "Choose the option that best describes how usage may change.",

                options: [
                    "Steady",
                    "Bursty",
                    "Seasonal",
                    "Not sure"
                ]
            });
        }


        if (!requirements.database) {

            questions.push({

                key: "database",

                title:
                    "What type of database do you need?",

                help:
                    "Choose the closest option.",

                options: [
                    "PostgreSQL",
                    "MySQL",
                    "NoSQL / DynamoDB",
                    "No database",
                    "Not sure"
                ]
            });
        }


        if (!requirements.storage) {

            questions.push({

                key: "storage",

                title:
                    "Will the application store uploaded files?",

                help:
                    "Examples include images, documents, videos, or other files.",

                options: [
                    "Yes",
                    "No",
                    "Not sure"
                ]
            });
        }


        if (!requirements.availability) {

            questions.push({

                key: "availability",

                title:
                    "What level of availability do you need?",

                help:
                    "High availability is useful when downtime must be minimized.",

                options: [
                    "Standard",
                    "High Availability",
                    "Not sure"
                ]
            });
        }


        if (!requirements.workloadType) {

            questions.push({

                key: "workloadType",

                title:
                    "How will your application run?",

                help:
                    "This helps determine whether Serverless, Containers, or EC2 is a better technical fit.",

                options: [
                    "Event-driven / functions",
                    "Containers / Docker",
                    "Traditional server / VM",
                    "General application",
                    "Not sure" 
                ]
            });
        }


        if (!requirements.managementPreference) {

            questions.push({

                key: "managementPreference",

                title:
                    "How much infrastructure management do you want?",

                help:
                    "Choose how much server and infrastructure management you want to handle.",

                options: [
                    "Minimal management",
                    "Some management",
                    "I want direct infrastructure control",
                    "Not sure"
                ]
            });
        }


        if (!requirements.infrastructureControl) {

            questions.push({

                key: "infrastructureControl",

                title:
                    "How much direct infrastructure control do you need?",

                help:
                    "Think about access to servers, operating systems, networking, and instances.",

                options: [
                    "Little or no direct control",
                    "Some infrastructure control",
                    "Full server / OS control",
                    "Not sure"
                ]
            });
        }


        currentQuestion = 0;
selectedAnswer = null;

if (questions.length === 0) {

    finishQuestions();

} else {

    // Show follow-up questions
    if (followupPanel) {
        followupPanel.classList.remove("hidden");
    }

    // Hide priorities until ALL questions are finished
    if (priorityPanel) {
        priorityPanel.classList.add("hidden");
    }

    // Hide confirmation section
    if (readyPanel) {
        readyPanel.classList.add("hidden");
    }

    // User cannot continue yet
    if (confirmButton) {
        confirmButton.disabled = true;
    }

    displayQuestion();
}
    }


    // =====================================================
    // DISPLAY QUESTION
    // =====================================================

    function displayQuestion() {

        const question =
            questions[currentQuestion];


        if (!question) {

            finishQuestions();

            return;
        }


        selectedAnswer = null;


        questionCounter.textContent =
            `Question ${currentQuestion + 1} of ${questions.length}`;


        questionTitle.textContent =
            question.title;


        questionHelp.textContent =
            question.help;


        answerOptions.innerHTML =
            "";


        question.options.forEach(option => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";

            button.className =
                "answer-option";

            button.textContent =
                option;


            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".answer-option"
                        )
                        .forEach(item => {

                            item.classList.remove(
                                "selected"
                            );
                        });


                    button.classList.add(
                        "selected"
                    );


                    selectedAnswer =
                        option;
                }
            );


            answerOptions.appendChild(
                button
            );
        });


        nextQuestionButton.textContent =
            currentQuestion ===
            questions.length - 1
                ? "Finish →"
                : "Next question →";
    }


    // =====================================================
    // NEXT QUESTION
    // =====================================================

    if (
        nextQuestionButton &&
        !nextQuestionButton.dataset.listenerAttached
    ) {

        nextQuestionButton.dataset.listenerAttached = "true";

        nextQuestionButton.addEventListener("click", () => {

            const selectedButton =
                answerOptions.querySelector(
                    ".answer-option.selected"
                );

            if (!selectedButton) {
                alert("Please choose an answer first.");
                return;
            }

            const answer =
                selectedButton.textContent.trim();

            saveAnswer(
                questions[currentQuestion].key,
                answer
            );

            currentQuestion++;

            if (currentQuestion >= questions.length) {
                finishQuestions();
            } else {
                displayQuestion();
            }
        });
    }

   
    


    // =====================================================
    // SKIP QUESTION
    // =====================================================

    if (skipButton) {

        skipButton.addEventListener(
            "click",
            () => {

                saveAnswer(
                    questions[currentQuestion].key,
                    "Not sure"
                );


                currentQuestion++;


                if (
                    currentQuestion >=
                    questions.length
                ) {

                    finishQuestions();

                } else {

                    displayQuestion();
                }
            }
        );
    }


    // =====================================================
    // SAVE ANSWER
    // =====================================================

    function saveAnswer(key, answer) {

        if (key === "applicationType") {

            requirements.applicationType =
                answer === "Not sure"
                    ? "Unknown"
                    : answer;
        }


        if (key === "users") {

            const userMap = {

                "Under 1,000": 500,

                "1,000 – 5,000": 2000,

                "5,000 – 20,000": 10000,

                "More than 20,000": 25000
            };


            requirements.users =
                answer === "Not sure"
                    ? null
                    : userMap[answer];
        }


        if (key === "trafficPattern") {

            requirements.trafficPattern =
                answer === "Not sure"
                    ? "Unknown"
                    : answer;
        }


        if (key === "database") {

            if (
                answer ===
                "NoSQL / DynamoDB"
            ) {

                requirements.database =
                    "DynamoDB";

            } else if (
                answer ===
                "No database"
            ) {

                requirements.database =
                    "None";

            } else if (
                answer ===
                "Not sure"
            ) {

                requirements.database =
                    "Not Selected";

            } else {

                requirements.database =
                    answer;
            }
        }


        if (key === "storage") {

            if (answer === "Yes") {

                requirements.storage =
                    "Required";

            } else if (
                answer === "No"
            ) {

                requirements.storage =
                    "Not required";

            } else {

                requirements.storage =
                    "Unknown";
            }
        }


        if (key === "availability") {

            requirements.availability =
                answer === "Not sure"
                    ? "Unknown"
                    : answer;
        }


        if (key === "workloadType") {

            const workloadMap = {

                "Event-driven / functions":
                    "event-driven",

                "Containers / Docker":
                    "containerized",

                "Traditional server / VM":
                    "traditional-server",

                "General application":
                    "general"
            };


            requirements.workloadType =
                answer === "Not sure"
                    ? null
                    : workloadMap[answer];
        }


        if (
            key ===
            "managementPreference"
        ) {

            const managementMap = {

                "Minimal management":
                    "low",

                "Some management":
                    "medium",

                "I want direct infrastructure control":
                    "high-control"
            };


            requirements.managementPreference =
                answer === "Not sure"
                    ? null
                    : managementMap[answer];
        }


        if (
            key ===
            "infrastructureControl"
        ) {

            const controlMap = {

                "Little or no direct control":
                    "low",

                "Some infrastructure control":
                    "medium",

                "Full server / OS control":
                    "high"
            };


            requirements.infrastructureControl =
                answer === "Not sure"
                    ? null

                
                    : controlMap[answer];
        }


        refreshRequirementCards();
    }

    // =====================================================
// USER PRIORITIES
// =====================================================

function resetPrioritySelection() {

    requirements.userPriorities = [];

    priorityOptions.forEach(
        button => {

            button.classList.remove(
                "selected"
            );

            button.setAttribute(
                "aria-pressed",
                "false"
            );
        }
    );

    updatePriorityUI();
}


function updatePriorityUI() {

    const selected =
        requirements.userPriorities || [];

    const balancedSelected =
        selected.includes("balanced");


    if (priorityCount) {

        priorityCount.textContent =
            balancedSelected
                ? "Balanced selected"
                : `${selected.length} of 2 selected`;
    }


    if (priorityHelp) {

        if (selected.length === 0) {

            priorityHelp.textContent =
                "Select at least one option to continue.";

        } else if (balancedSelected) {

            priorityHelp.textContent =
                "Standard evaluation weights will be used.";

        } else {

            priorityHelp.textContent =
                "Your priorities will influence the architecture evaluation.";
        }
    }


    if (confirmButton) {

        confirmButton.disabled =
            selected.length === 0;
    }
}


priorityOptions.forEach(
    button => {

        button.setAttribute(
            "aria-pressed",
            "false"
        );


        button.addEventListener(
            "click",
            () => {

                const priority =
                    button.dataset.priority;


                let selected = [
                    ...(requirements.userPriorities || [])
                ];


                // Balanced cannot be combined
                // with another priority.

                if (priority === "balanced") {

                    selected =
                        selected.includes("balanced")
                            ? []
                            : ["balanced"];

                } else {

                    selected =
                        selected.filter(
                            item =>
                                item !== "balanced"
                        );


                    if (
                        selected.includes(
                            priority
                        )
                    ) {

                        selected =
                            selected.filter(
                                item =>
                                    item !== priority
                            );

                    } else {

                        if (
                            selected.length >= 2
                        ) {

                            alert(
                                "Choose up to two priorities."
                            );

                            return;
                        }


                        selected.push(
                            priority
                        );
                    }
                }


                requirements.userPriorities =
                    selected;


                priorityOptions.forEach(
                    option => {

                        const isSelected =
                            selected.includes(
                                option.dataset.priority
                            );


                        option.classList.toggle(
                            "selected",
                            isSelected
                        );


                        option.setAttribute(
                            "aria-pressed",
                            String(isSelected)
                        );
                    }
                );


                updatePriorityUI();
            }
        );
    }
);


    // =====================================================
    // REQUIREMENTS READY
    // =====================================================

    function finishQuestions() {

            followupPanel.classList.add(
                "hidden"
            );


            readyPanel.classList.remove(
                "hidden"
            );


            if (priorityPanel) {

                priorityPanel.classList.remove(
                    "hidden"
                );
            }


            updatePriorityUI();


            refreshRequirementCards();
        }


    // =====================================================
    // CREATE PAYLOAD

    // =====================================================

    function createRequirementsPayload() {

        return {

            application_type:
                requirements.applicationType,

            expected_users:
                requirements.users,

            traffic_pattern:
                requirements.trafficPattern,

            database:
                requirements.database,

            storage_required:
                requirements.storage ===
                "Required"
                    ? true
                    : requirements.storage ===
                      "Not required"
                        ? false
                        : null,

            availability:
                requirements.availability,

            workload_type:
                requirements.workloadType,

            management_preference:
                requirements.managementPreference,

            infrastructure_control:
                requirements.infrastructureControl,

            user_priorities:
                requirements.userPriorities || [],

            region:
                requirements.region,

            budget:
                Number(
                    requirements.budget
                )
        };
    }


    // =====================================================
    // CONFIRM
    // =====================================================

    if (confirmButton) {

        confirmButton.addEventListener(
            "click",
            () => {

                requestArchitectureAnalysis();
            }
        );
    }


    // =====================================================
    // ARCHITECTURE PIPELINE
    // =====================================================

    async function requestArchitectureAnalysis(fromReview = false) {

        const actionButton = fromReview ? reviewSaveButton : confirmButton;
        if (!actionButton) return false;
        actionButton.disabled = true;


        const originalButtonText =
            actionButton.textContent;


        const payload =
            createRequirementsPayload();


        console.log(
            "Confirmed requirements:",
            payload
        );


        aiRecommendationExplanation =
            null;

        recommendationAssumptions = [];

        try {

            // =================================================
            // 1. GENERATE ARCHITECTURES
            // =================================================

            actionButton.textContent =
                "Generating architectures...";


            const architectureResponse =
                await fetch(
                    `${API_BASE_URL}/api/architectures`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(payload)
                    }
                );


            if (!architectureResponse.ok) {

                throw new Error(
                    "Architecture API returned " +
                    architectureResponse.status
                );
            }


            const architectureData =
                await architectureResponse.json();


            generatedArchitectures =
                architectureData.architectures ||
                [];


            console.log(
                "Generated architectures:",
                generatedArchitectures
            );


            // =================================================
            // 2. COSTS
            // =================================================

            actionButton.textContent =
                "Calculating costs...";


            const costResponse =
                await fetch(
                    `${API_BASE_URL}/api/costs`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(payload)
                    }
                );


            if (!costResponse.ok) {

                throw new Error(
                    "Cost API returned " +
                    costResponse.status
                );
            }


            architectureCosts =
                await costResponse.json();


            console.log(
                "Architecture costs:",
                architectureCosts
            );


            // =================================================
            // 3. EVALUATE
            // =================================================

            actionButton.textContent =
                "Evaluating architectures...";


            const evaluationResponse =
                await fetch(
                    `${API_BASE_URL}/api/evaluate`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(payload)
                    }
                );


            if (!evaluationResponse.ok) {
                

                throw new Error(
                    "Evaluation API returned " +
                    evaluationResponse.status
                );
            }


            const evaluationData =
                await evaluationResponse.json();


            architectureEvaluations =
                evaluationData.evaluations ||
                [];


            recommendedArchitectureId =
                evaluationData
                    .recommended_architecture_id;


            console.log(
                "Architecture evaluations:",
                architectureEvaluations
            );


            console.log(
                "Recommended architecture:",
                recommendedArchitectureId
            );


            // =================================================
            // 4. AI EXPLANATION
            // =================================================

            actionButton.textContent =
                "Generating explanation...";


            try {

                const recommendationResponse =
                    await fetch(
                        `${API_BASE_URL}/api/recommendation`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(payload)
                        }
                    );


                if (!recommendationResponse.ok) {

                    throw new Error(
                        "Recommendation API returned " +
                        recommendationResponse.status
                    );
                }


                const recommendationData =
                    await recommendationResponse.json();


                aiRecommendationExplanation =
                    recommendationData.explanation ||
                    null;

                recommendationAssumptions =
                    recommendationData.assumptions ||
                    [];



                console.log(
                    "AI recommendation explanation:",
                    aiRecommendationExplanation
                );


                if (
                    recommendationData
                        .recommended_architecture_id &&
                    recommendationData
                        .recommended_architecture_id !==
                        recommendedArchitectureId
                ) {

                    console.warn(
                        "Recommendation endpoint returned a different architecture ID. Keeping deterministic result:",
                        recommendedArchitectureId
                    );
                }


            } catch (
                recommendationError
            ) {

                console.error(
                    "AI explanation failed:",
                    recommendationError
                );


                aiRecommendationExplanation =
                    null;
            }
    
            // =================================================
// 5. TRADE-OFF ANALYSIS
// =================================================

actionButton.textContent =
    "Analyzing trade-offs...";

try {

    const tradeoffResponse =
        await fetch(
            `${API_BASE_URL}/api/tradeoffs`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(payload)
            }
        );


    if (!tradeoffResponse.ok) {

        throw new Error(
            "Trade-off API returned " +
            tradeoffResponse.status
        );
    }


    tradeoffAnalysis =
        await tradeoffResponse.json();


    console.log(
        "Trade-off analysis:",
        tradeoffAnalysis
    );


} catch (tradeoffError) {

    console.error(
        "Trade-off analysis failed:",
        tradeoffError
    );

    tradeoffAnalysis = null;
}


// =================================================
// 6. CONSTRAINT CONFLICT DETECTION
// =================================================

actionButton.textContent =
    "Checking constraints...";

try {

    const conflictResponse =
        await fetch(
            `${API_BASE_URL}/api/conflicts`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(payload)
            }
        );


    if (!conflictResponse.ok) {

        throw new Error(
            "Conflict API returned " +
            conflictResponse.status
        );
    }


    conflictAnalysis =
        await conflictResponse.json();


    console.log(
        "Constraint conflicts:",
        conflictAnalysis
    );


} catch (conflictError) {

    console.error(
        "Conflict analysis failed:",
        conflictError
    );

    conflictAnalysis = null;
}


// =================================================
// 7. DISPLAY
// =================================================

            populateArchitectureResults();

            if (fromReview) {
                populateRecommendation();
                populateReviewRequirements();
                refreshReviewPriorities();
                reviewEditForm.classList.add("hidden");
                document.body.classList.remove("review-modal-open");
                reviewSummaryContent.classList.remove("hidden");
                editReviewButton.classList.remove("hidden");
                showScreen("review", 6);
            } else {
                showScreen("results", 4);
            }
            return true;


        } catch (error) {

            console.error(
                "Architecture analysis failed:",
                error
            );


            alert("Could not recalculate the architecture. Please try again.");
            return false;


        } finally {

            actionButton.disabled = false;


            actionButton.textContent =
                originalButtonText;
        }
    }


    // =====================================================
    // POPULATE COMPARE SCREEN
    // =====================================================

    function populateArchitectureResults() {

        setText(
            "resultApplication",
            requirements.applicationType ||
            "Unknown"
        );

        setText(
            "resultUsers",
            requirements.users
                ? "~ " +
                  Number(
                      requirements.users
                  ).toLocaleString()
                : "Unknown"
        );

        setText(
            "resultDatabase",
            requirements.database ||
            "Unknown"
        );

        setText(
            "resultStorage",
            requirements.storage ||
            "Unknown"
        );

        setText(
            "resultAvailability",
            requirements.availability ||
            "Unknown"
        );


        const cards =
            document.querySelectorAll(
                ".architecture-card"
            );


        const architectureIds = [
            "serverless",
            "containers",
            "virtual-machines"
        ];


        cards.forEach(
            (card, index) => {

                if (
                    architectureIds[index]
                ) {

                    card.dataset
                        .architectureId =
                        architectureIds[index];
                }
            }
        );


        architectureIds.forEach(
            (architectureId, index) => {

                const architecture =
                    generatedArchitectures.find(
                        item =>
                            item.id ===
                            architectureId
                    );


                if (
                    architecture &&
                    cards[index]
                ) {

                    updateArchitectureCardElement(
                        cards[index],
                        architecture
                    );
                }
            }
        );


        // =================================================
        // COSTS
        // =================================================

        const costMap = {

            serverless: {
                costId:
                    "serverlessCost",

                budgetId:
                    "serverlessBudgetFit"
            },

            containers: {
                costId:
                    "containerCost",

                budgetId:
                    "containerBudgetFit"
            },

            "virtual-machines": {
                costId:
                    "vmCost",

                budgetId:
                    "vmBudgetFit"
            }
        };


        architectureIds.forEach(
            architectureId => {

                const cost =
                    architectureCosts.find(
                        item =>
                            item.architecture_id ===
                            architectureId
                    );


                const config =
                    costMap[
                        architectureId
                    ];


                if (
                    cost &&
                    config
                ) {

                    setText(
                        config.costId,

                        Number(
                            cost.total_monthly_cost
                        ).toFixed(2)
                    );


                    updateBudgetFit(
                        config.budgetId,
                        cost.total_monthly_cost
                    );
                }
            }
        );
        
        // =================================================
        // EVALUATION
        // =================================================

        architectureIds.forEach(
            (architectureId, index) => {

                if (cards[index]) {

                    updateEvaluationDisplay(
                        cards[index],
                        architectureId
                    );
                }
            }
        );


        // =================================================
        // RECOMMENDATION
        // =================================================

        applyRecommendedVisual(
            recommendedArchitectureId
        );


        console.log(
            "Compare screen populated."
        );
    }


    // =====================================================
    // ARCHITECTURE CARD
    // =====================================================

    function updateArchitectureCardElement(
        card,
        architecture
    ) {

        const title =
            card.querySelector(
                ".architecture-title h2"
            );


        const description =
            card.querySelector(
                ".architecture-title p"
            );


        if (title) {

            title.textContent =
                architecture.name;
        }


        if (description) {

            description.textContent =
                architecture.description;
        }


        const serviceGrid =
            card.querySelector(
                ".service-grid"
            );


        if (serviceGrid) {

            serviceGrid.innerHTML =
                "";


            architecture.services.forEach(
                service => {

                    const serviceItem =
                        document.createElement(
                            "div"
                        );


                    serviceItem.className =
                        "service-item";


                    const icon =
                        document.createElement(
                            "span"
                        );


                    icon.textContent =
                        getServiceShortName(
                            service.name
                        );


                    const details =
                        document.createElement(
                            "div"
                        );


                    const name =
                        document.createElement(
                            "strong"
                        );


                    name.textContent =
                        service.name;


                    const role =
                        document.createElement(
                            "small"
                        );


                    role.textContent =
                        service.role;


                    details.appendChild(name);
                    details.appendChild(role);

                    serviceItem.appendChild(icon);
                    serviceItem.appendChild(details);

                    serviceGrid.appendChild(
                        serviceItem
                    );
                }
            );
        }
    }


    // =====================================================
    // GET EVALUATION
    // =====================================================

    function getEvaluation(
        architectureId
    ) {

        return architectureEvaluations.find(
            evaluation =>
                evaluation.architecture_id ===
                architectureId
        );
    }


    // =====================================================
    // GET CRITERION
    // =====================================================

    function getCriterion(
        evaluation,
        criterionName
    ) {

        if (!evaluation) {
            return null;
        }


        return evaluation.criteria.find(
            criterion =>
                criterion.name ===
                criterionName
        );
    }


    // =====================================================
    // LABEL HELPERS
    // =====================================================

    function getBudgetFitLabel(score) {

        if (score >= 9) {
            return "Strong";
        }

        if (score >= 7) {
            return "Good";
        }

        if (score >= 5) {
            return "Fair";
        }

        if (score > 0) {
            return "Limited";
        }

        return "Over budget";
    }


    function getScoreLabel(score) {

        if (score >= 9) {
            return "High";
        }

        if (score >= 6) {
            return "Medium";
        }
        
        return "Low";
    }


    function getManagementLabel(score) {

        if (score >= 9) {
            return "Strong";
        }

        if (score >= 6) {
            return "Good";
        }

        return "Low";
    }


    // =====================================================
    // UPDATE EVALUATION DISPLAY
    // =====================================================

    function updateEvaluationDisplay(
        card,
        architectureId
    ) {

        const evaluation =
            getEvaluation(
                architectureId
            );


        if (!evaluation) {

            return;
        }


        const budgetCriterion =
            getCriterion(
                evaluation,
                "Budget fit"
            );


        const workloadCriterion =
            getCriterion(
                evaluation,
                "Workload fit"
            );


        const scalabilityCriterion =
            getCriterion(
                evaluation,
                "Scalability"
            );


        const managementCriterion =
            getCriterion(
                evaluation,
                "Management fit"
            );


        const requirementCriterion =
            getCriterion(
                evaluation,
                "Requirement fit"
            );


        const scoreItems =
            card.querySelectorAll(
                ".score-grid > div"
            );


        scoreItems.forEach(item => {

            const label =
                item.querySelector("span");

            const value =
                item.querySelector("strong");


            if (
                !label ||
                !value
            ) {

                return;
            }


            const labelText =
                label.textContent
                    .trim()
                    .toLowerCase();


            if (
                labelText ===
                "budget fit" &&
                budgetCriterion
            ) {

                value.textContent =
                    getBudgetFitLabel(
                        budgetCriterion.score
                    );
            }


            if (
                labelText ===
                "workload fit" &&
                workloadCriterion
            ) {

                value.textContent =
                    getScoreLabel(
                        workloadCriterion.score
                    );
            }


            if (
                labelText ===
                "scalability" &&
                scalabilityCriterion
            ) {

                value.textContent =
                    getScoreLabel(
                        scalabilityCriterion.score
                    );
            }


            if (
                labelText ===
                "management fit" &&
                managementCriterion
            ) {

                value.textContent =
                    getManagementLabel(
                        managementCriterion.score
                    );
            }


            if (
                labelText ===
                "requirement fit" &&
                requirementCriterion
            ) {

                value.textContent =
                    getScoreLabel(
                        requirementCriterion.score
                    );
            }
        });
    }


    // =====================================================
    // RECOMMENDED VISUAL
    // =====================================================

    function applyRecommendedVisual(
        architectureId
    ) {

        const cards =
            document.querySelectorAll(
                ".architecture-card"
            );


        cards.forEach(card => {

            card.classList.remove(
                "recommended-card"
            );


            card.style.removeProperty(
                "border"
            );


            card
                .querySelectorAll(
                    ".dynamic-recommended-banner"
                )
                .forEach(element => {

                    element.remove();
                });


            card
                .querySelectorAll(
                    ".dynamic-recommendation-button"
                )
                .forEach(element => {

                    element.remove();
                });
        });


        const recommendedCard =
            Array.from(cards).find( 
                card =>
                    card.dataset
                        .architectureId ===
                    architectureId
            );


        if (!recommendedCard) {

            console.warn(
                "Could not find recommended card:",
                architectureId
            );

            return;
        }


        recommendedCard.classList.add(
            "recommended-card"
        );


        const banner =
            document.createElement(
                "div"
            );


        banner.className =
            "recommended-banner dynamic-recommended-banner";


        banner.textContent =
            "★ RECOMMENDED";


        recommendedCard.insertBefore(
            banner,
            recommendedCard.firstChild
        );


        const button =
            document.createElement(
                "button"
            );


        button.type =
            "button";


        button.className =
            "primary-button full-button view-recommendation dynamic-recommendation-button";


        button.textContent =
            "View recommendation →";


        button.addEventListener(
            "click",
            () => {

                populateRecommendation();

                showScreen(
                    "recommendation",
                    5
                );
            }
        );


        const architectureContent =
            recommendedCard.querySelector(
                ".architecture-content"
            );


        if (architectureContent) {

            architectureContent.appendChild(
                button
            );

        } else {

            recommendedCard.appendChild(
                button
            );
        }


        console.log(
            "Recommended visual applied to:",
            architectureId
        );
 
    }

 
    // =====================================================
    // REVIEW & REFINE NAVIGATION
    // =====================================================

    const labels = {
        trafficPattern: {
            steady: "Steady traffic",
            bursty: "Bursty traffic",
            spiky: "Bursty traffic",
            seasonal: "Seasonal traffic"
        },

        database: {
            postgresql: "PostgreSQL",
            mysql: "MySQL",
            dynamodb: "NoSQL / DynamoDB",
            nosql: "NoSQL / DynamoDB",
            none: "Not required",
            unknown: "Not sure"
        },

        availability: {
            standard: "Standard availability",
            high: "High availability",
            "high availability": "High availability"
        },

        workloadType: {
            general: "General application",
            "event-driven": "Event-driven",
            containerized: "Containers / Docker",
            "traditional-server": "Traditional server"
        },

        managementPreference: {
            low: "Minimal management",
            medium: "Some management",
            "high-control": "Direct management"
        },

        infrastructureControl: {
            low: "Low infrastructure control",
            medium: "Medium infrastructure control",
            high: "High infrastructure control"
        },

        region: {
            "us-east-1": "US East (N. Virginia)"
        }
    };


    function readable(field, value) {

        if (value === null ||
            value === undefined ||
            value === "") {
            return "Not specified";
        }

        const key = String(value).trim().toLowerCase();

        return labels[field]?.[key] ?? String(value);
    }


    function populateReviewRequirements() {

        const container =
            document.getElementById("reviewRequirementsSummary");

        if (!container) return;

        const values = {
            application: requirements.applicationType || "Not specified",
            users: requirements.users == null ? "Not specified" : Number(requirements.users).toLocaleString() + " users",
            traffic: readable("trafficPattern", requirements.trafficPattern),
            database: readable("database", requirements.database),
            storage: requirements.storage === true || String(requirements.storage).toLowerCase() === "required" ? "Required" : requirements.storage === false || String(requirements.storage).toLowerCase() === "not required" ? "Not required" : String(requirements.storage ?? "Not specified"),
            availability: readable("availability", requirements.availability),
            workload: readable("workloadType", requirements.workloadType),
            management: readable("managementPreference", requirements.managementPreference),
            control: readable("infrastructureControl", requirements.infrastructureControl),
            region: readable("region", requirements.region),
            budget: requirements.budget == null ? "Not specified" : "$" + Number(requirements.budget).toLocaleString()
        };
        // Compact read-only icon badges. Keep the existing edit form and state untouched.
        container.replaceChildren();
        const chipRow = document.createElement("div");
        chipRow.className = "review-config-chips";
        const chips = [
            ["users", values.users],
            ["activity", values.traffic],
            ["database", values.database],
            ["shield-check", values.availability],
            ["container", values.workload],
            ["hard-drive", "Storage: " + values.storage],
            ["settings", values.management],
            ["sliders-horizontal", values.control],
            ["map-pin", values.region],
            ["wallet", values.budget + " / month"]
        ];
        chips.forEach(([icon, label]) => {
            const chip = document.createElement("span");
            chip.className = "review-config-chip";
            const symbol = document.createElement("i");
            symbol.setAttribute("data-lucide", icon);
            chip.append(symbol, document.createTextNode(label));
            chipRow.appendChild(chip);
        });
        container.appendChild(chipRow);
        if (window.lucide?.createIcons) window.lucide.createIcons();
    }


    // =====================================================
    // NAVIGATION BUTTONS
    // =====================================================

    const reviewRefineButton =
        document.getElementById("reviewRefineButton");

    const continueDecisionButton =
        document.getElementById("continueDecisionButton");

    const backToRecommendationButton =
        document.getElementById("backToRecommendationButton");


    // Recommendation → Review & Refine
    reviewRefineButton?.addEventListener("click", () => {

        populateReviewRequirements();

        showScreen("review", 6);

    });


    // Review & Refine → Recommendation
    backToRecommendationButton?.addEventListener("click", () => {

        showScreen("recommendation", 5);

    });


    // Review & Refine → Final Decision
    continueDecisionButton?.addEventListener("click", () => {
    if (populateFinalDecision()) {
        showScreen("decision", 7);
    }
});


function populateFinalDecision() {

    const architecture = generatedArchitectures.find(
        item => item.id === recommendedArchitectureId
    );

    if (!architecture) {
        alert("Please complete the architecture evaluation first.");
        return false;
    }

    const setDecisionText = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    };

    const money = value =>
        Number.isFinite(Number(value))
            ? "$" + Number(value).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })
            : "Not available";

    const costRecord = architectureCosts.find(
        item => item.architecture_id === recommendedArchitectureId
    );

    const monthlyCost =
        costRecord?.estimated_monthly_cost ??
        costRecord?.monthly_cost ??
        costRecord?.total_monthly_cost ??
        costRecord?.total_cost ??
        costRecord?.estimated_cost;

    const budget = Number(requirements.budget);
    const cost = monthlyCost == null ? NaN : Number(monthlyCost);

    setDecisionText("decisionArchitectureName", architecture.name);

    setDecisionText(
        "decisionExplanation",
        aiRecommendationExplanation ||
        "This architecture was selected based on your requirements and priorities."
    );

    setDecisionText("decisionCost", money(cost));
    setDecisionText("decisionBudget", money(budget));

    setDecisionText(
        "decisionBudgetStatus",
        costRecord?.within_budget === true
            ? "Within monthly budget"
            : costRecord?.within_budget === false
                ? "Over monthly budget"
                : "Budget status unavailable"
    );

    setDecisionText(
        "decisionRemainingBudget",
        Number.isFinite(cost) && Number.isFinite(budget)
            ? cost <= budget
                ? `${money(budget - cost)} remaining in your budget`
                : `${money(cost - budget)} over your budget`
            : "Remaining budget unavailable"
    );

    
    // ==========================================
    // STAGE 7 — DYNAMIC BUDGET COLORS
    // ==========================================

    const isWithinBudget =
        Number.isFinite(cost) &&
        Number.isFinite(budget) &&
        cost <= budget;

    const budgetStatusElement =
        document.getElementById("decisionBudgetStatus");

    const budgetAlertElement =
        document.getElementById("decisionBudgetAlert");

    const budgetAlertSymbol =
        budgetAlertElement?.querySelector(".decision-alert-symbol");

    const budgetMessageElement =
        document.getElementById("decisionBudgetMessage");

    // Change colors based on the budget result
    budgetStatusElement?.classList.toggle(
        "is-within-budget",
        isWithinBudget
    );

    budgetAlertElement?.classList.toggle(
        "is-within-budget",
        isWithinBudget
    );
    document.getElementById("decisionRemainingBudget")?.classList.toggle("canvas-within-budget", isWithinBudget);

    // Update the icon
    if (budgetAlertSymbol) {
        budgetAlertSymbol.textContent =
            isWithinBudget ? "✓" : "!";
    }

    // Update the message
    if (budgetMessageElement) {
        budgetMessageElement.textContent =
            !Number.isFinite(cost) || !Number.isFinite(budget)
                ? "Budget comparison is unavailable."
                : isWithinBudget
                    ? "This architecture fits your monthly budget."
                    : "This architecture exceeds your monthly budget.";
    }


    
// AWS services: use a matching Lucide icon for each service type.
    const servicesList = document.getElementById("decisionServices");
    if (servicesList) {
        servicesList.replaceChildren();
        const services = Array.isArray(architecture.services) ? architecture.services : [];
        const iconForService = (name) => {
            const s = name.toLowerCase();
            if (s.includes("api gateway")) return "globe";
            if (s.includes("lambda")) return "zap";
            if (s.includes("s3")) return "hard-drive";
            if (s.includes("aurora") || s.includes("rds") || s.includes("database")) return "database";
            if (s.includes("ecs") || s.includes("fargate") || s.includes("container")) return "container";
            if (s.includes("load balancer") || s.includes("alb")) return "network";
            if (s.includes("auto scaling")) return "arrow-up-down";
            if (s.includes("ec2")) return "server";
            if (s.includes("cloudfront")) return "globe-2";
            return "cloud";
        };
        services.forEach(service => {
            const name = typeof service === "string" ? service : (service.name || service.service || "AWS service");
            const li = document.createElement("li");
            const icon = document.createElement("i");
            icon.setAttribute("data-lucide", iconForService(name));
            icon.setAttribute("aria-hidden", "true");
            const title = document.createElement("span");
            title.textContent = name;
            li.append(icon, title);
            servicesList.appendChild(li);
        });
        if (!services.length) {
            const li = document.createElement("li");
            li.textContent = "Service details are not available.";
            servicesList.appendChild(li);
        }
    }
    if (window.lucide?.createIcons) window.lucide.createIcons();

    // Remaining conflicts and trade-offs
    const considerations =
        document.getElementById("decisionConsiderations");

    if (considerations) considerations.replaceChildren();

    const conflicts = Array.isArray(conflictAnalysis?.conflicts)
        ? conflictAnalysis.conflicts
        : [];

    const addConsideration = text => {
        const li = document.createElement("li");
        li.textContent = text;
        considerations?.appendChild(li);
    };

    conflicts.forEach(conflict => {
        const message = typeof conflict === "string"
            ? conflict
            : conflict.message || conflict.description;

        if (message) addConsideration(message);
    });

    if (conflicts.length === 0) {
        addConsideration("No unresolved conflicts were reported.");
    }

    // Reset confirmation when entering the screen
    document.getElementById("decisionConfirmation")
        ?.classList.add("hidden");

    document.getElementById("confirmArchitectureButton")
        ?.classList.remove("hidden");

    document.getElementById("decisionStartOverButton")
        ?.classList.add("hidden");

    document.getElementById("downloadArchitectureReportButton")
        ?.classList.add("hidden");
    return true;
}


// Back to Stage 6
document.getElementById("decisionBackButton")
    ?.addEventListener("click", () => {
        showScreen("review", 6);
    });


// Confirm architecture
document.getElementById("confirmArchitectureButton")
    ?.addEventListener("click", () => {

        document.getElementById("decisionConfirmation")
            ?.classList.remove("hidden");

        document.getElementById("confirmArchitectureButton")
            ?.classList.add("hidden");

        document.getElementById("decisionStartOverButton")
            ?.classList.remove("hidden");

        document.getElementById("downloadArchitectureReportButton")
            ?.classList.remove("hidden");
    });



// Download a PDF through the browser's built-in Print / Save as PDF dialog.
// No external PDF library or server-side storage is required.
document.getElementById("downloadArchitectureReportButton")
    ?.addEventListener("click", () => {
        const root = document.getElementById("architecturePrintableReport");
        const architecture = generatedArchitectures.find(
            item => item.id === recommendedArchitectureId
        );
        if (!root || !architecture) return;

        const costRecord = architectureCosts.find(
            item => item.architecture_id === recommendedArchitectureId
        );
        const estimatedCost = costRecord?.total_monthly_cost ??
            costRecord?.estimated_monthly_cost ?? costRecord?.monthly_cost;
        const money = value => value == null || !Number.isFinite(Number(value))
            ? "Unavailable" : "$" + Number(value).toFixed(2);
        const make = (tag, value, className) => {
            const element = document.createElement(tag);
            if (className) element.className = className;
            if (value !== undefined && value !== null) element.textContent = String(value);
            return element;
        };
        const addSection = (title, entries) => {
            root.appendChild(make("h2", title));
            const table = make("table");
            entries.forEach(([label, value]) => {
                const row = make("tr");
                row.append(make("th", label), make("td", value ?? "Not specified"));
                table.appendChild(row);
            });
            root.appendChild(table);
        };
        root.replaceChildren();
        root.appendChild(make("h1", "Cloud Architecture Decision Report"));
        root.appendChild(make("p", "Generated " + new Date().toLocaleString(), "report-date"));
        root.appendChild(make("h2", "Selected Architecture"));
        root.appendChild(make("h3", architecture.name));
        root.appendChild(make("p", aiRecommendationExplanation ||
            "Selected based on the evaluated requirements and priorities."));
        addSection("Application Requirements", [
            ["Application", requirements.applicationType],
            ["Description", appDescription?.value?.trim()],
            ["Expected users", requirements.users],
            ["Traffic", requirements.trafficPattern],
            ["Database", requirements.database],
            ["File storage", requirements.storage],
            ["Availability", requirements.availability],
            ["Workload", requirements.workloadType],
            ["Management preference", requirements.managementPreference],
            ["Infrastructure control", requirements.infrastructureControl],
            ["AWS region", requirements.region],
            ["Priorities", (requirements.userPriorities || []).join(", ") || "None selected"]
        ]);
        addSection("Cost and Budget", [
            ["Estimated monthly cost", money(estimatedCost)],
            ["Monthly budget", money(requirements.budget)],
            ["Budget fit", estimatedCost == null ? "Unavailable" :
                Number(estimatedCost) <= Number(requirements.budget) ? "Within budget" : "Over budget"]
        ]);
        root.appendChild(make("h2", "AWS Services"));
        const serviceList = make("ul");
        (architecture.services || []).forEach(service => serviceList.appendChild(
            make("li", typeof service === "string" ? service :
                [service.name, service.role].filter(Boolean).join(" — "))
        ));
        root.appendChild(serviceList);
        root.appendChild(make("h2", "Conflicts and Considerations"));
        const conflictList = make("ul");
        const conflicts = Array.isArray(conflictAnalysis?.conflicts) ? conflictAnalysis.conflicts : [];
        (conflicts.length ? conflicts : ["No unresolved conflicts were reported."])
            .forEach(conflict => conflictList.appendChild(make("li",
                typeof conflict === "string" ? conflict :
                    conflict.message || conflict.description || "Conflict detected")));
        root.appendChild(conflictList);
        root.appendChild(make("p", "Estimates are for planning and are not an AWS price quote.", "report-footer"));
        window.print();
    });

// Start over
document.getElementById("decisionStartOverButton")
    ?.addEventListener("click", () => {
        window.location.reload();
    });


    // =============================================
// REVIEW & REFINE — EDIT REQUIREMENTS
// =============================================


    const editReviewButton =
    document.getElementById("editReviewRequirementsButton");

const cancelReviewButton =
    document.getElementById("cancelReviewEditButton");

const reviewEditForm =
    document.getElementById("reviewEditForm");

const reviewRequirementsSummary =
    document.getElementById("reviewRequirementsSummary");

const reviewSummaryContent =
    document.getElementById("reviewSummaryContent"); 


// Step 6 save button and priority inputs
const reviewSaveButton = document.getElementById("saveReviewRequirementsButton") ||
    document.getElementById("saveReviewEditButton") ||
    Array.from(reviewEditForm?.querySelectorAll("button") || [])
        .find(button => /save\s*&\s*recalculate/i.test(button.textContent));

const reviewPriorityInputs = () => Array.from(
    reviewEditForm?.querySelectorAll('.review-priority-options input[type="checkbox"]') || []
);

function getReviewPriorityValue(input) { 
    return input.dataset.priority || input.value;
}

function refreshReviewPriorities() {
    const list = document.getElementById("recommendationPriorityList");
    if (!list) return;
    const labels = {
        cost: "Lowest cost", low_management: "Less management",
        infrastructure_control: "Maximum control", scalability: "High scalability",
        availability: "High availability", balanced: "Balanced"
    };
    list.replaceChildren();
    (requirements.userPriorities || []).forEach(priority => {
        const item = document.createElement("li");
        item.textContent = "✓ " + (labels[priority] || priority);
        list.appendChild(item);
    });
}

editReviewButton?.addEventListener("click", () => {

    document.getElementById("editExpectedUsers").value =
        requirements.users ?? "";

    document.getElementById("editMonthlyBudget").value =
        requirements.budget ?? "";

    document.getElementById("editTrafficPattern").value =
        requirements.trafficPattern ?? "unknown";

    document.getElementById("editDatabase").value =
        requirements.database ?? "unknown";

    const availabilitySelect =
    document.getElementById("editAvailability");

    const availabilityValue = requirements.availability;

    availabilitySelect.value =
    availabilityValue === "high"
        ? "high availability"
        : availabilityValue || "standard";

    if (availabilitySelect.selectedIndex === -1) {
    availabilitySelect.value = "standard";
    }

    document.getElementById("editWorkloadType").value =
    requirements.workloadType ?? "general";

    document.getElementById("editManagementPreference").value =
        requirements.managementPreference ?? "low";

    document.getElementById("editInfrastructureControl").value =
        requirements.infrastructureControl ?? "low";

    document.getElementById("editStorage").value =
        requirements.storage ?? "Unknown";

    reviewPriorityInputs().forEach(input => {
        input.checked = (requirements.userPriorities || []).includes(getReviewPriorityValue(input));
    });

    document.getElementById("editApplicationType").value = requirements.applicationType ?? "";
    const regionInput = document.getElementById("editAwsRegion");
    regionInput.value = requirements.region ?? "us-east-1";
    if (regionInput.selectedIndex === -1) regionInput.value = "us-east-1";
    reviewEditForm.classList.remove("hidden");
    document.body.classList.add("review-modal-open");
    document.getElementById("editApplicationType")?.focus();
});

cancelReviewButton?.addEventListener("click", () => {

    // Close the popup without changing the requirements
    reviewEditForm.classList.add("hidden");
    document.body.classList.remove("review-modal-open");

    // Show requirements and priorities summary
    document
        .getElementById("reviewSummaryContent")
        .classList.remove("hidden");

    // Show the Edit button again
    editReviewButton.classList.remove("hidden");

});
document.getElementById("closeReviewModalButton")?.addEventListener("click", () => cancelReviewButton?.click());
reviewEditForm?.addEventListener("click", event => { if (event.target === reviewEditForm) cancelReviewButton?.click(); });
document.addEventListener("keydown", event => { if (event.key === "Escape" && !reviewEditForm?.classList.contains("hidden")) cancelReviewButton?.click(); });



// Confirm a successful save only after the recalculation API returns successfully.
let reviewSuccessToastTimer;
function showReviewSuccessToast() {
    const toast = document.getElementById("reviewSaveSuccessToast");
    if (!toast) return;
    toast.classList.add("is-visible");
    clearTimeout(reviewSuccessToastTimer);
    reviewSuccessToastTimer = setTimeout(() => toast.classList.remove("is-visible"), 4500);
}

let reviewHasSuccessfulEdit = false;

function populateReviewUpdatedRecommendation(previousArchitectureId, wasEdited = reviewHasSuccessfulEdit) {
    const panel = document.getElementById("reviewUpdatedRecommendation");
    if (!panel) return;

    const recommended = generatedArchitectures.find(item => String(item.id) === String(recommendedArchitectureId));
    if (!recommended) {
        panel.classList.add("hidden");
        return;
    }

    setText("reviewRecommendationHeading", wasEdited ? "Recommendation updated" : "Current recommendation");
    const viewButton = document.getElementById("viewUpdatedRecommendationButton");
    // Details remain on Stage 6 so users do not lose their place.
    setText("reviewDetailsTitle", `Why ${recommended.name}?`);
    const explanation = aiRecommendationExplanation?.explanation ||
        aiRecommendationExplanation?.summary ||
        aiRecommendationExplanation?.reason ||
        (typeof aiRecommendationExplanation === "string" ? aiRecommendationExplanation : "");
    setText("reviewDetailsExplanation", explanation || `${recommended.name} is the best overall match for your selected requirements and priorities. Compare its cost and trade-offs before proceeding.`);
    const continueButton = document.getElementById("continueDecisionButton");
    if (continueButton) continueButton.textContent = `Continue with ${recommended.name} →`;

    const formatMoney = value => Number.isFinite(Number(value))
        ? "$" + Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : "Not available";
    const monthlyCost = cost => cost?.estimated_monthly_cost ?? cost?.monthly_cost ??
        cost?.total_monthly_cost ?? cost?.total_cost ?? cost?.estimated_cost;
    const selectedCost = architectureCosts.find(item => item.architecture_id === recommendedArchitectureId);
    const amount = monthlyCost(selectedCost);
    const budget = Number(requirements.budget);
    const allAmounts = generatedArchitectures.map(architecture => {
        const cost = architectureCosts.find(item => item.architecture_id === architecture.id);
        return monthlyCost(cost);
    });
    const allOverBudget = Number.isFinite(budget) && budget > 0 &&
        allAmounts.length > 0 && allAmounts.every(value => value != null && Number.isFinite(Number(value)) && Number(value) > budget);

    setText("reviewUpdatedArchitectureName", recommended.name);
    setText("reviewUpdatedCost", amount == null ? "Not available" : formatMoney(amount));
    setText("reviewUpdatedBudget", formatMoney(requirements.budget));

    const previous = generatedArchitectures.find(item => item.id === previousArchitectureId);
    setText("reviewRecommendationMessage", previousArchitectureId && previousArchitectureId !== recommendedArchitectureId
        ? `Your recommendation changed from ${previous?.name || "the previous architecture"} to ${recommended.name}.`
        : (wasEdited ? "Your updated requirements have been evaluated." : "Recommended based on your current requirements."));

    const notice = document.getElementById("reviewUpdatedBudgetNotice");
    if (notice) {
        notice.classList.remove("is-over-budget", "is-within-budget", "is-unknown");
        if (allOverBudget) {
            notice.textContent = "None of the three evaluated architectures meets your monthly budget. This is the best overall match, not a budget-compliant option.";
            notice.classList.add("is-over-budget");
        } else if (amount != null && Number.isFinite(Number(amount)) && Number.isFinite(budget) && budget > 0) {
            const difference = Number(amount) - budget;
            notice.textContent = difference > 0
                ? `${formatMoney(difference)} over your monthly budget.`
                : "Within your monthly budget.";
            notice.classList.add(difference > 0 ? "is-over-budget" : "is-within-budget");
        } else {
            notice.textContent = "Budget status is not available.";
            notice.classList.add("is-unknown");
        }
    }
    panel.classList.remove("hidden");
}

document.getElementById("viewUpdatedRecommendationButton")?.addEventListener("click", () => {
    const button = document.getElementById("viewUpdatedRecommendationButton");
    const details = document.getElementById("reviewRecommendationDetails");
    if (!button || !details) return;
    const opening = details.classList.contains("hidden");
    details.classList.toggle("hidden", !opening);
    button.setAttribute("aria-expanded", String(opening));
    const chevron = button.querySelector(".review-details-chevron");
    if (chevron) chevron.style.transform = opening ? "rotate(180deg)" : "";
});

// Save and recalculate from Step 6
reviewSaveButton?.addEventListener("click", async event => {
    event.preventDefault();
    const usersInput = document.getElementById("editExpectedUsers");
    const budgetField = document.getElementById("editMonthlyBudget");
    const users = Number(usersInput?.value);
    const budget = Number(budgetField?.value);
    if (!Number.isInteger(users) || users <= 0) {
        alert("Enter a valid number of expected users.");
        usersInput?.focus();
        return;
    }
    if (!Number.isFinite(budget) || budget <= 0) {
        alert("Enter a monthly budget greater than zero.");
        budgetField?.focus();
        return;
    }

    const priorities = reviewPriorityInputs()
        .filter(input => input.checked)
        .map(getReviewPriorityValue);
    if (priorities.length === 0 || priorities.length > 2 ||
        (priorities.includes("balanced") && priorities.length > 1)) {
        alert("Choose one or two priorities. Balanced must be selected alone.");
        return;
    }

    const appType = document.getElementById("editApplicationType")?.value.trim();
    if (!appType) { alert("Enter an application type."); document.getElementById("editApplicationType")?.focus(); return; }
    const previousArchitectureId = recommendedArchitectureId;

    const previous = { ...requirements, userPriorities: [...(requirements.userPriorities || [])] };
    requirements.applicationType = appType;
    requirements.region = document.getElementById("editAwsRegion")?.value || previous.region;
    requirements.users = users;
    requirements.budget = budget;
    requirements.trafficPattern = document.getElementById("editTrafficPattern")?.value || previous.trafficPattern;
    requirements.database = document.getElementById("editDatabase")?.value || previous.database;
    requirements.availability = document.getElementById("editAvailability")?.value || previous.availability;
    requirements.userPriorities = priorities;

    requirements.workloadType =
    document.getElementById("editWorkloadType").value;

    requirements.managementPreference =
        document.getElementById("editManagementPreference").value;

    requirements.infrastructureControl =
        document.getElementById("editInfrastructureControl").value;

    requirements.storage =
        document.getElementById("editStorage").value;

   const succeeded = await requestArchitectureAnalysis(true);

if (!succeeded) {
    requirements = previous;
} else {
    reviewHasSuccessfulEdit = true;
    populateReviewUpdatedRecommendation(previousArchitectureId, true);
    populateConflicts(); // Hide duplicate budget warnings, keep unrelated conflicts.
    showReviewSuccessToast();
}
});

// =====================================================
// CONSTRAINT CONFLICT DISPLAY
// =====================================================

const assumptionCountElement = document.getElementById("assumptionsCount");
const assumptionSummaryElement = document.getElementById("assumptionsDescription");
if (assumptionCountElement && assumptionSummaryElement) {
    const syncAssumptionSummary = () => {
        const count = assumptionCountElement.textContent.trim();
        assumptionSummaryElement.textContent = count;
    };
    new MutationObserver(syncAssumptionSummary).observe(assumptionCountElement, { childList: true, characterData: true, subtree: true });
    syncAssumptionSummary();
}

// Accessible expandable conflict and assumption details.
[["conflictsToggle", "conflictsList"], ["assumptionsToggle", "assumptionsList"]].forEach(([buttonId, panelId]) => {
    const toggle = document.getElementById(buttonId);
    const panel = document.getElementById(panelId);
    if (!toggle || !panel) return;
    toggle.addEventListener("click", () => {
        const open = toggle.getAttribute("aria-expanded") !== "true";
        toggle.setAttribute("aria-expanded", String(open));
        panel.classList.toggle("hidden", !open);
        const action = toggle.querySelector(".review-disclosure-action");
        if (action) action.textContent = open ? "Hide ⌃" : "View ⌄";
    });
});

function populateConflicts() {

    const card =
        document.getElementById("conflictsCard");

    const container =
        document.getElementById("conflictsList");

    const conflictsCount =
        document.getElementById("conflictsCount");

    if (!card || !container) {
        return;
    }

    // Clear previous results
    container.replaceChildren();

    // Get conflicts from the API response
    const conflicts =
        conflictAnalysis?.has_conflicts &&
        Array.isArray(conflictAnalysis.conflicts)
            ? conflictAnalysis.conflicts
            : [];

    // The compact result already explains a budget violation. Do not repeat
    // that same warning in the separate conflicts panel after recalculation.
    const updatedResultVisible = !document.getElementById("reviewUpdatedRecommendation")?.classList.contains("hidden");
    const visibleConflicts = updatedResultVisible
        ? conflicts.filter(conflict => !/budget|monthly cost|monthly price|afford|\$[0-9]/i.test(conflict.message || ""))
        : conflicts;
    const total = visibleConflicts.length;

    // Update the conflict count
    if (conflictsCount) {
        conflictsCount.textContent =
            `${total} ${total === 1 ? "conflict" : "conflicts"}`;
    }

    // Hide the entire card when no conflicts exist
    if (total === 0) {
        card.classList.add("hidden");
        return;
    }

    // Display each detected conflict
    visibleConflicts.forEach(conflict => {

        const item =
            document.createElement("div");

        item.className = "conflict-item";

        const content =
            document.createElement("div");

        content.className = "conflict-content";

        const message =
            document.createElement("p");

        message.textContent =
            conflict.message ||
            "A constraint conflict was detected.";

        content.appendChild(message);
        item.appendChild(content);
        container.appendChild(item);

    });

    // Show the card while preserving the user's expanded/collapsed choice.
    card.classList.remove("hidden");
    const summary = document.getElementById("conflictsSummary");
    if (summary) summary.textContent = `${visibleConflicts.length} conflict${visibleConflicts.length === 1 ? "" : "s"} detected`;
}



// =====================================================
// TRADE-OFF CRITERION LABELS
// =====================================================

function formatTradeoffCriterion(criterion, direction) {

    const labels = {
        "Budget fit": {
            gain: "Better budget fit",
            loss: "Worse budget fit"
        },

        "Workload fit": {
            gain: "Better suited to your workload",
            loss: "Less suited to your workload"
        },

        "Scalability": {
            gain: "Better scalability fit",
            loss: "Lower scalability fit"
        },

        "Management fit": {
            gain: "Better matches your management and control preferences",
            loss: "Less suited to your management and control preferences"
        },

        "Requirement fit": {
            gain: "Better matches your application requirements",
            loss: "Less suited to your application requirements"
        }
    };

    const label = labels[criterion];

    if (label && label[direction]) {
        return label[direction];
    }

    return direction === "gain"
        ? `Better fit for ${criterion}`
        : `Worse fit for ${criterion}`;
}

    // =====================================================
// TRADE-OFF DISPLAY
// =====================================================

function populateTradeoffs() {

    const card =
        document.getElementById(
            "tradeoffCard"
        );

    const container =
        document.getElementById(
            "tradeoffAlternatives"
        );


    if (!card || !container) {
        return;
    }


    container.innerHTML = "";


    if (
        !tradeoffAnalysis ||
        !tradeoffAnalysis.alternatives ||
        tradeoffAnalysis.alternatives.length === 0
    ) {

        card.classList.add("hidden");

        return;
    }


    tradeoffAnalysis.alternatives.forEach(
        alternative => {

            const alternativeCard =
                document.createElement("div");

            alternativeCard.className =
                "tradeoff-alternative";


            // -----------------------------------------
            // HEADER
            // -----------------------------------------

            const header =
                document.createElement("div");

            header.className =
                "tradeoff-alternative-heading";


            const title =
                document.createElement("strong");

            title.textContent =
                alternative.architecture_name;


            const cost =
                document.createElement("span");

            cost.textContent =
                "$" +
                Number(
                    alternative.estimated_monthly_cost
                ).toFixed(2) +
                " / month";


            header.appendChild(title);
            header.appendChild(cost);

            alternativeCard.appendChild(header);


            // -----------------------------------------
            // COST DIFFERENCE
            // -----------------------------------------

            const costComparison =
                alternative.cost_comparison;


            if (costComparison) {

                const costDifference =
                    document.createElement("p");

                costDifference.className =
                    "tradeoff-cost-difference";


                if (
                    costComparison.cost_status ===
                    "cheaper"
                ) {

                    costDifference.textContent =
                        "Save $" +
                        Number(
                            costComparison.savings
                        ).toFixed(2) +
                        " / month";

                } else if (
                    costComparison.cost_status ===
                    "more_expensive"
                ) {

                    costDifference.textContent =
                        "Costs $" +
                        Math.abs(
                            Number(
                                costComparison.savings
                            )
                        ).toFixed(2) +
                        " more / month";

                } else {

                    costDifference.textContent =
                        "Same estimated monthly cost";
                }


                alternativeCard.appendChild(
                    costDifference
                );
            }


            // -----------------------------------------
// GAINS
// -----------------------------------------

                if (
                    alternative.gains &&
                    alternative.gains.length > 0
                ) {

                    const gainsSection =
                        document.createElement("div");

                    gainsSection.className =
                        "tradeoff-section";


                    const gainsTitle =
                        document.createElement("span");

                    gainsTitle.className =
                        "tradeoff-section-title gain";

                    gainsTitle.textContent =
                        "Benefits";


                    gainsSection.appendChild(
                        gainsTitle
                    );


                    const gainsList =
                        document.createElement("ul");


                    alternative.gains.forEach(
                        gain => {

                            const item =
                                document.createElement("li");

                            item.textContent =
                                formatTradeoffCriterion(
                                    gain.criterion,
                                    "gain"
                                );

                            gainsList.appendChild(item);
                        }
                    );


                    gainsSection.appendChild(
                        gainsList
                    );

                    alternativeCard.appendChild(
                        gainsSection
                    );
                }

            // -----------------------------------------
            // LOSSES
            // -----------------------------------------

            const lossesSection =
                document.createElement("div");

            lossesSection.className =
                "tradeoff-section";
                

            const lossesTitle =
                document.createElement("span");

            lossesTitle.className =
                "tradeoff-section-title loss";

            lossesTitle.textContent =
                "Trade-offs";


            lossesSection.appendChild(
                lossesTitle
            );


            const lossesList =
                document.createElement("ul");


            if (
                alternative.losses &&
                alternative.losses.length > 0
            ) {

               alternative.losses.forEach(
    loss => {

        const item =
            document.createElement("li");

        item.textContent =
            formatTradeoffCriterion(
                loss.criterion,
                "loss"
            );


        lossesList.appendChild(
            item
        );
    }
);

            } else {

                const item =
                    document.createElement("li");

                item.textContent =
                    "No evaluated criterion decreases.";

                lossesList.appendChild(item);
            }


            lossesSection.appendChild(
                lossesList
            );

            alternativeCard.appendChild(
                lossesSection
            );


            container.appendChild(
                alternativeCard
            );
        }
    );


    card.classList.remove("hidden");
}


    // =====================================================
    // RECOMMENDATION PAGE
    // =====================================================

    function populateRecommendation() {

        const recommendedArchitecture =
            generatedArchitectures.find(
                architecture =>
                    architecture.id ===
                    recommendedArchitectureId
            );


        const recommendedCost =
            architectureCosts.find(
                cost =>
                    cost.architecture_id ===
                    recommendedArchitectureId
            );


        const recommendedEvaluation =
            architectureEvaluations.find(
                evaluation =>
                    evaluation.architecture_id ===
                    recommendedArchitectureId
            );


        if (!recommendedArchitecture) {

            console.error(
                "Recommended architecture not found:",
                recommendedArchitectureId
            );

            return;
        }


        setText(
            "recommendationTitle",

            recommendedArchitecture.name +
            " is the best fit"
        );


        setText(
            "recommendedArchitectureName",

            "AWS " +
            recommendedArchitecture.name +
            " Architecture"
        );


        if (
            recommendedCost &&
            recommendedCost.within_budget
        ) {

            setText(
                "recommendationSummary",

                "Recommendation based on your technical requirements, budget, priorities, estimated AWS costs, and architecture evaluation."
            );

        } else {

            setText(
                "recommendationSummary",

                "No architecture fully fits the current budget. This option provides the strongest overall fit based on the evaluated requirements, your priorities, and budget constraints."
            );
           
                        

        }

        


       // =================================================
// SERVICES
// =================================================

const servicesContainer =
    document.getElementById("recommendedServices");

if (servicesContainer) {
    servicesContainer.replaceChildren();

    const services = Array.isArray(recommendedArchitecture.services)
        ? recommendedArchitecture.services
        : [];

    services.forEach(service => {
        const name = typeof service === "string"
            ? service
            : service?.name || service?.service || "AWS service";

        const lowerName = name.toLowerCase();

        let symbol = "☁";

        if (lowerName.includes("load balancer")) {
            symbol = "◇";
        } else if (
            lowerName.includes("ecs") ||
            lowerName.includes("fargate") ||
            lowerName.includes("container")
        ) {
            symbol = "⬡";
        } else if (lowerName.includes("s3")) {
            symbol = "▱";
        } else if (
            lowerName.includes("rds") ||
            lowerName.includes("database") ||
            lowerName.includes("aurora") ||
            lowerName.includes("dynamodb")
        ) {
            symbol = "▤";
        } else if (lowerName.includes("lambda")) {
            symbol = "λ";
        } else if (lowerName.includes("ec2")) {
            symbol = "▣";
        }

        // Stage 5 presentation only: label each service by its role.
        // The AWS service names and backend recommendation remain unchanged.
        let serviceRole = "SERVICE";
        if (lowerName.includes("load balancer") || lowerName.includes("api gateway") || lowerName.includes("cloudfront")) {
            serviceRole = "TRAFFIC";
        } else if (lowerName.includes("s3") || lowerName.includes("storage") || lowerName.includes("efs")) {
            serviceRole = "STORAGE";
        } else if (lowerName.includes("rds") || lowerName.includes("aurora") || lowerName.includes("dynamodb") || lowerName.includes("database")) {
            serviceRole = "DATABASE";
        } else if (lowerName.includes("ecs") || lowerName.includes("fargate") || lowerName.includes("lambda") || lowerName.includes("ec2") || lowerName.includes("compute") || lowerName.includes("container")) {
            serviceRole = "COMPUTE";
        }

        const tile = document.createElement("li");
        const role = document.createElement("span");
        role.className = "service-role";
        role.textContent = serviceRole;

        const icon = document.createElement("span");
        icon.className = "decision-service-icon";
        icon.textContent = symbol;
        icon.setAttribute("aria-hidden", "true");

        const title = document.createElement("span");
        title.className = "decision-service-name";
        title.textContent = name;

        const heading = document.createElement("div");
        heading.className = "service-role-heading";
        heading.append(icon, role);
        tile.append(heading, title);
        servicesContainer.appendChild(tile);
    });

    if (services.length === 0) {
        const message = document.createElement("li");
        message.textContent = "Service details are not available.";
        servicesContainer.appendChild(message);
    }
}
                // =================================================
        // USER PRIORITIES
        // =================================================


        const prioritiesContainer =
            document.getElementById(
                "recommendationPriorities"
            );


        const priorityList =
            document.getElementById(
                "recommendationPriorityList"
            );


        const priorityLabels = {

            cost:
                "Lowest cost",

            low_management:
                "Less management",

            infrastructure_control:
                "Maximum control",

            scalability:
                "High scalability",

            availability:
                "High availability",

            balanced:
                "Balanced / recommend for me"
        };


        if (
            prioritiesContainer &&
            priorityList
        ) {

            priorityList.innerHTML = "";


            const selectedPriorities =
                requirements.userPriorities || [];


            if (
                selectedPriorities.length > 0
            ) {

                selectedPriorities.forEach(
                    priority => {

                        const badge =
                            document.createElement(
                                "span"
                            );


                        badge.className =
                            "recommendation-priority-badge";


                        badge.textContent =
                            priorityLabels[priority] ||
                            priority;


                        priorityList.appendChild(
                            badge
                        );
                    }
                );


                prioritiesContainer.classList.remove(
                    "hidden"
                );

            } else {

                prioritiesContainer.classList.add(
                    "hidden"
                );
            }
        }


        // =================================================
        // WHY THIS OPTION
        // =================================================

        const reasonsList =
            document.getElementById(
                "recommendationReasons"
            );


        if (reasonsList) {

            reasonsList.innerHTML =
                "";


            if (
                aiRecommendationExplanation
            ) {

                const item =
                    document.createElement(
                        "li"
                    );


                item.textContent =
                    aiRecommendationExplanation;


                reasonsList.appendChild(
                    item
                );


            } else if (
                recommendedEvaluation &&
                recommendedEvaluation.criteria
            ) {

                recommendedEvaluation
                    .criteria
                    .forEach(criterion => {

                        const item =
                            document.createElement(
                                "li"
                            );


                        item.textContent =
                            criterion.reason;


                        reasonsList.appendChild(
                            item
                        );
                    });
            }
        }

 // =================================================
// REQUIREMENT SUMMARY
// =================================================

                        setText(
                            "recommendationBudget",
                            requirements.budget !== null &&
                            requirements.budget !== undefined
                                ? "$" + Number(requirements.budget).toLocaleString()
                                : "Unknown"
                        );

                        setText(
                            "recommendationUsers",
                            requirements.users !== null &&
                            requirements.users !== undefined
                                ? Number(requirements.users).toLocaleString()
                                : "Unknown"
                        );

                        setText(
                            "recommendationDatabase",
                            requirements.database || "Unknown"
                        );

                        setText(
                            "recommendationAvailability",
                            requirements.availability || "Unknown"
                        );


    // =================================================
// CONSTRAINT CONFLICTS
// =================================================

populateConflicts();


// =================================================
// TRADE-OFFS
// =================================================

populateTradeoffs();

  
 // =================================================
 // ASSUMPTIONS
 // =================================================

const assumptionsCard =
    document.getElementById("assumptionsCard");

const assumptionsList =
    document.getElementById("assumptionsList");

const assumptionsCount =
    document.getElementById("assumptionsCount");

const assumptionsDescription =
    document.getElementById("assumptionsDescription");

if (
    assumptionsCard &&
    assumptionsList &&
    assumptionsCount &&
    assumptionsDescription
) {
    const assumptions = Array.isArray(recommendationAssumptions)
        ? recommendationAssumptions.filter(
            assumption =>
                typeof assumption === "string" && 
                assumption.trim().length > 0
          )
        : [];

    const total = assumptions.length;

    // Hide the entire card when there are no assumptions.
    assumptionsCard.classList.toggle("hidden", total === 0);

    // Update assumption count
    assumptionsCount.textContent =
        `${total} ${total === 1 ? "assumption" : "assumptions"}`;

    // Update description
    assumptionsDescription.textContent =
        total === 0
            ? "No assumptions were needed for this analysis."
            : "These assumptions were used where requirements were missing or uncertain.";

    // Clear previous assumptions
    assumptionsList.replaceChildren();

    if (total > 0) {

        assumptions.forEach(assumption => {
            const item = document.createElement("li");
            item.textContent = assumption;
            assumptionsList.appendChild(item);
        });

        assumptionsList.classList.toggle("hidden",
            document.getElementById("assumptionsToggle")?.getAttribute("aria-expanded") !== "true");

    } else {

        // Hide only the list, not the card
        assumptionsList.classList.add("hidden");
    }
}


     // =================================================
// COST + BUDGET STATUS
// =================================================

if (recommendedCost) {

            const monthlyCost =
                Number(
                    recommendedCost.total_monthly_cost
                );

            const monthlyBudget =
                Number(
                    requirements.budget
                );

            const withinBudget =
                recommendedCost.within_budget === true ||
                monthlyCost <= monthlyBudget;


            // Display estimated monthly cost
            setText(
                "recommendedArchitectureCost",
                "$" +
                monthlyCost.toFixed(2) +
                " / month"
            );


            // Recommendation badge
            const fitBadge =
                document.getElementById(
                    "recommendationFitBadge"
                );


            // Cost status below estimated cost
            const costStatus =
                document.getElementById(
                    "recommendationCostStatus"
                );


            if (withinBudget) {

                if (fitBadge) {

                    fitBadge.textContent =
                        "Recommended fit";

                    fitBadge.classList.remove(
                        "over-budget"
                    );
                }


                if (costStatus) {

                    costStatus.textContent =
                        "Within budget";

                    costStatus.classList.remove(
                        "over-budget"
                    );
                }

            } else {

                const amountOverBudget =
                    monthlyCost - monthlyBudget;


                if (fitBadge) {

                    fitBadge.textContent =
                        "Recommended fit · Over budget";

                    fitBadge.classList.add(
                        "over-budget"
                    );
                }


                if (costStatus) {

                    costStatus.textContent =
                        "$" +
                        amountOverBudget.toFixed(2) +
                        " over budget";

                    costStatus.classList.add(
                        "over-budget"
                    );
                }
            }
        }
    }

    // =====================================================
    // SERVICE SHORT NAME
    // =====================================================

    function getServiceShortName(
        serviceName
    ) {

        const name =
            serviceName.toLowerCase();


        if (
            name.includes("api gateway")
        ) {
            return "API";
        }


        if (
            name.includes("lambda")
        ) {
            return "λ";
        }


        if (
            name.includes("s3")
        ) {
            return "S3";
        }


        if (
            name.includes("aurora")
        ) {
            return "DB";
        }


        if (
            name.includes("rds")
        ) {
            return "RDS";
        }


        if (
            name.includes("fargate") ||
            name.includes("ecs")
        ) {
            return "ECS";
        }


        if (
            name.includes(
                "load balancer"
            )
        ) {
            return "ALB";
        }


        if (
            name.includes("ec2")
        ) {
            return "EC2";
        }


        if (
            name.includes("dynamodb")
        ) {
            return "DB";
        }


        return "AWS";
    }





    // =====================================================
    // BUDGET STATUS
    // =====================================================

    function updateBudgetFit(
        id,
        cost
    ) {

        const element =
            document.getElementById(id);


        if (!element) {

            return;
        }


        const numericCost =
            Number(cost);


        const numericBudget =
            Number(
                requirements.budget
            );


        if (
            numericCost <=
            numericBudget
        ) {

            element.textContent =
                "✓ Within budget";


            element.classList.remove(
                "over-budget"
            );

        } else {

            element.textContent =
                "Over budget";


            element.classList.add(
                "over-budget"
            );
        }
    }


    // =====================================================
    // BACK BUTTONS
    // =====================================================

    if (editRequestButton) {

        editRequestButton.addEventListener(
            "click",
            () => {

                showScreen(
                    "describe",
                    1
                );
            }
        );
    }


    const backToAnalysisButton =
        document.getElementById(
            "backToAnalysisButton"
        );


    if (backToAnalysisButton) {

        backToAnalysisButton.addEventListener(
            "click",
            () => {

                showScreen(
                    "analysis",
                    3
                );
            }
        );
    }


    const backToResultsButton =
        document.getElementById(
            "backToResultsButton"
        );


    if (backToResultsButton) {

        backToResultsButton.addEventListener(
            "click",
            () => {

                showScreen(
                    "results",
                    4
                );
            }
        );
    }


    if (homeButton) {

        homeButton.addEventListener(
            "click",
            () => {

                showScreen(
                    "describe",
                    1
                );
            }
        );
    }

 

    // =====================================================
    // HELPER
    // =====================================================

    function setText(id, value) {

        const element =
            document.getElementById(id);


        if (element) {

            element.textContent =
                value;
        }
    }


    // =====================================================
    // START
    // =====================================================

    showScreen("describe", 1);

    startPlaceholderTyping();

});

















       
