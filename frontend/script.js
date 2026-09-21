document.addEventListener("DOMContentLoaded", () => {

    // =====================================================
    // ELEMENTS
    // =====================================================

    const screens = {
        describe: document.getElementById("describeScreen"),
        loading: document.getElementById("loadingScreen"),
        analysis: document.getElementById("analysisScreen"),
        results: document.getElementById("resultsScreen"),
        recommendation: document.getElementById("recommendationScreen")
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
    // API CONFIGURATION
    // =====================================================

    const API_BASE_URL =
        "https://budget-aware-cloud-recommender.onrender.com";

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
        region: "us-east-1",
        budget: 300
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

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }


    // =====================================================
    // PROGRESS
    // =====================================================

    function updateProgress(stepNumber) {

        const percentages = [0, 25, 50, 75, 100];

        if (progressFill) {
            progressFill.style.width =
                percentages[stepNumber - 1] + "%";
        }

        progressSteps.forEach((step, index) => {

            step.classList.remove("active", "complete");

            const circle =
                step.querySelector(".step-circle");

            if (index + 1 < stepNumber) {

                step.classList.add("complete");

                if (circle) {
                    circle.textContent = "✓";
                }

            } else {

                if (circle) {
                    circle.textContent = index + 1;
                }
            }

            if (index + 1 === stepNumber) {
                step.classList.add("active");
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

            sendAnalysisRequest(description);
        });
    }


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

            followupPanel.classList.remove(
                "hidden"
            );

            readyPanel.classList.add(
                "hidden"
            );

            confirmButton.disabled =
                true;

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

    if (nextQuestionButton) {

        nextQuestionButton.addEventListener(
            "click",
            () => {

                if (!selectedAnswer) {

                    alert(
                        "Please choose an answer first."
                    );

                    return;
                }


                saveAnswer(
                    questions[currentQuestion].key,
                    selectedAnswer
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
                    "Unknown";

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
    // REQUIREMENTS READY
    // =====================================================

    function finishQuestions() {

        followupPanel.classList.add(
            "hidden"
        );

        readyPanel.classList.remove(
            "hidden"
        );

        confirmButton.disabled =
            false;

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

    async function requestArchitectureAnalysis() {

        confirmButton.disabled =
            true;


        const originalButtonText =
            confirmButton.textContent;


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

            confirmButton.textContent =
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

            confirmButton.textContent =
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

            confirmButton.textContent =
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

            confirmButton.textContent =
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
            // 5. DISPLAY
            // =================================================

            populateArchitectureResults();

            showScreen("results", 4);


        } catch (error) {

            console.error(
                "Architecture analysis failed:",
                error
            );


            alert(
                "Could not generate the architecture comparison. Check the backend and try again."
            );


        } finally {

            confirmButton.disabled =
                false;


            confirmButton.textContent =
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
                "Management effort"
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

                "This option provides the strongest fit for your requirements while staying within your monthly AWS budget."
            );

        } else {

            setText(
                "recommendationSummary",

                "No architecture fully fits the current budget. This option provides the closest overall fit based on cost and your requirements."
            );
        }


        // =================================================
        // SERVICES
        // =================================================

        const servicesContainer =
            document.getElementById(
                "recommendedServices"
            );


        if (servicesContainer) {

            servicesContainer.innerHTML =
                "";


            recommendedArchitecture
                .services
                .forEach(service => {

                    const serviceBox =
                        document.createElement(
                            "div"
                        );


                    const icon =
                        document.createElement(
                            "span"
                        );


                    icon.textContent =
                        getServiceShortName(
                            service.name
                        );


                    const name =
                        document.createElement(
                            "strong"
                        );


                    name.textContent =
                        service.name;


                    serviceBox.appendChild(icon);
                    serviceBox.appendChild(name);

                    servicesContainer.appendChild(
                        serviceBox
                    );
                });
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
// ASSUMPTIONS
// =================================================

const assumptionsCard =
    document.getElementById(
        "assumptionsCard"
    );


const assumptionsList =
    document.getElementById(
        "assumptionsList"
    );


if (
    assumptionsCard &&
    assumptionsList
) {

    assumptionsList.innerHTML =
        "";


    if (
        recommendationAssumptions.length > 0
    ) {

        recommendationAssumptions
            .forEach(assumption => {

                const item =
                    document.createElement(
                        "li"
                    );


                item.textContent =
                    assumption;


                assumptionsList.appendChild(
                    item
                );
            });


        assumptionsCard.classList.remove(
            "hidden"
        );

    } else {

        assumptionsCard.classList.add(
            "hidden"
        );
    }
}


        // =================================================
        // COST
        // =================================================

        if (recommendedCost) {

            setText(
                "recommendedArchitectureCost",

                "$" +
                Number(
                    recommendedCost
                        .total_monthly_cost
                ).toFixed(2) +
                " / month"
            );
        }


        // =================================================
        // REQUIREMENTS
        // =================================================

        setText(
            "recommendationBudget",

            "$" +
            Number(
                requirements.budget
            ).toLocaleString()
        );


        setText(
            "recommendationUsers",

            requirements.users
                ? Number(
                    requirements.users
                ).toLocaleString()
                : "Unknown"
        );


        setText(
            "recommendationDatabase",

            requirements.database ||
            "Unknown"
        );


        setText(
            "recommendationAvailability",

            requirements.availability ||
            "Unknown"
        );


        console.log(
            "Recommendation page populated:",
            recommendedArchitectureId
        );


        console.log(
            "Displayed AI explanation:",
            aiRecommendationExplanation
        );
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

});