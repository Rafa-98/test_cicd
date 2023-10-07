def deploymentDecision(branch) {
    switch(branch) {
        case "main": return false; break;
        case branch.contains("hotfix"): return true; break;
        case branch.contains("release"): return true; break;
        case "qa": return true; break;
        case "develop": return true; break;
        case branch.contains("feature"): return false; break;
        case branch.contains("fix"): return false; break;
        default: false; break;        
    }
}

def getDeploymentName(branch) {
    switch(branch) {
        case "main": return "production"; break;
        case branch.contains("hotfix"): return "hotfix"; break;
        case branch.contains("release"): return "preprod"; break;
        case "qa": return "qa"; break;
        case "develop": return "develop"; break;        
        default: "unknown"; break;    
    }
}

node {   
    // ---------------------------------------------------- VARIABLES DEFINITION -------------------------------------------------------- //
    def currentBranch = ""
    def detailsURL = "http://95.22.2.142:49520"
    def status = [in_progress: "IN_PROGRESS", completed: "COMPLETED", queued: "QUEUED"]
    def githubChecks = [
        unit_tests: "Unit Tests", 
        code_analysis: "Code Analysis", 
        app_build: "App Build", 
        app_publish: "Publish App to Registry", 
        app_deployment: "App Deployment"
    ]
    def conclusions = [
        action_required: "ACTION_REQUIRED", 
        skipped: "SKIPPED", 
        canceled: "CANCELED", 
        time_out: "TIME_OUT", 
        failure: "FAILURE", 
        neutral: "NEUTRAL", 
        success: "SUCCESS", 
        none: "NONE"
    ]
    def app_name = "poc-info-cicd"

    // ---------------------------------------------------- GET REPOSITORY CODE -------------------------------------------------------- //
    stage('validate branch name') {        
        def github_credentials_id = "rafa_github_credentials"
        def repository_url = "https://github.com/Rafa-98/test_cicd"
        if(env.CHANGE_BRANCH) {
            git branch: env.CHANGE_BRANCH, credentialsId: "${github_credentials_id}", url: "${repository_url}"
            currentBranch = env.CHANGE_BRANCH
        }
        else {
            git branch: env.BRANCH_NAME, credentialsId: "${github_credentials_id}", url: "${repository_url}"
            currentBranch = env.BRANCH_NAME
        }
    }

    // ---------------------------------------------------- UNIT TESTS -------------------------------------------------------------------- //
    stage('Code unit tests') { 
        publishChecks name: "${githubChecks.unit_tests}", detailsURL: "${detailsURL}", status: "${status.in_progress}", conclusion: "${conclusions.none}"
        sh 'npm install'
        sh 'npm run test'
        publishChecks name: "${githubChecks.unit_tests}", detailsURL: "${detailsURL}", status: "${status.completed}", conclusion: "${conclusions.success}"
    }    

    // ---------------------------------------------------- CODE ANALYSIS -------------------------------------------------------- //
    stage('Code Analysis') {
        publishChecks name: "${githubChecks.code_analysis}", detailsURL: "${detailsURL}", status: "${status.in_progress}", conclusion: "${conclusions.none}"
        try {
            def scannerHome = tool 'dev_sonar_scanner'
            withSonarQubeEnv('dev_sonarqube_server') {
                withCredentials([string(credentialsId: 'sonar-poc-info-token', variable: 'sonarProjectToken')]) {
                    sh "${scannerHome}/bin/sonar-scanner -Dsonar.projectKey=poc-info -Dsonar.login=${sonarProjectToken} -Dsonar.branch.name=${currentBranch}"            
                }
            }
        } catch(Exception e) {
            sh "echo ERROR: Ha ocurrido un error durante la ejecución de análisis de código. ${e.getMessage()}"
            publishChecks name: "${githubChecks.code_analysis}", detailsURL: "${detailsURL}", status: "${status.completed}", conclusion: "${conclusions.failure}"
        }
    }    

    // ---------------------------------------------------- WAIT FOR QUALITY GATE -------------------------------------------------------- //
    stage("Quality Gate") {
        timeout(time: 1, unit: 'HOURS') {
            def qg = waitForQualityGate()
            if (qg.status != 'OK') {
                publishChecks name: "${githubChecks.code_analysis}", detailsURL: "${detailsURL}", status: "${status.completed}", conclusion: "${conclusions.failure}"
                error "ERROR: Pipeline aborted due to quality gate failure: ${qg.status}"
            }
            else {
                sh 'echo SUCCESS: El proyecto aprobó los criterios mínimos de calidad.'
                publishChecks name: "${githubChecks.code_analysis}", detailsURL: "${detailsURL}", status: "${status.completed}", conclusion: "${conclusions.success}"
            }
        }
    }
    
    def shouldDeploy = deploymentDecision(env.BRANCH_NAME)
    if(shouldDeploy) {
        // ---------------------------------------------------- APP IMAGE BUILD ---------------------------------------------------------------- //
        stage("App Image Build") {
            try {
                publishChecks name: "${githubChecks.app_build}", detailsURL: "${detailsURL}", status: "${status.in_progress}", conclusion: "${conclusions.none}"
                sh "docker build . -t mendezrafael98/${app_name}:${getDeploymentName(env.BRANCH_NAME)}"            
                publishChecks name: "${githubChecks.app_build}", detailsURL: "${detailsURL}", status: "${status.completed}", conclusion: "${conclusions.success}"
            } catch(Exception ex) {
                publishChecks name: "${githubChecks.app_build}", detailsURL: "${detailsURL}", status: "${status.completed}", conclusion: "${conclusions.failure}"
                error "ERROR. Aborting App Build execution. ${e.getMessage()}"
            }
        }

        // ---------------------------------------------------- APP PUBLISH TO REGISTRY -------------------------------------------------------- //
        stage("App publish to Container Registry") {
            try {
                publishChecks name: "${githubChecks.app_publish}", detailsURL: "${detailsURL}", status: "${status.in_progress}", conclusion: "${conclusions.none}"
                withDockerRegistry([ credentialsId: "rafa_docker_registry_credentials", url: "" ]) {
                    sh "docker push mendezrafael98/${app_name}:${getDeploymentName(env.BRANCH_NAME)}"
                }
                publishChecks name: "${githubChecks.app_publish}", detailsURL: "${detailsURL}", status: "${status.completed}", conclusion: "${conclusions.success}"
            } catch(Exception ex) {
                publishChecks name: "${githubChecks.app_publish}", detailsURL: "${detailsURL}", status: "${status.completed}", conclusion: "${conclusions.failure}"
                error "ERROR. Aborting App Publish to Container Registry execution. ${e.getMessage()}"
            }
        }

        // ---------------------------------------------------- APP DEPLOYMENT-------- -------------------------------------------------------- //
        stage("App deployment") {
            try {
                publishChecks name: "${githubChecks.app_deployment}", detailsURL: "${detailsURL}", status: "${status.in_progress}", conclusion: "${conclusions.none}"
                ansiblePlaybook credentialsId: 'admin_ssh_access', disableHostKeyChecking: true, installation: 'dev_ansible_server', inventory: '/etc/ansible/hosts', playbook: "/usr/local/ansible/manifests/${app_name}/execute-deployment.yaml", extraVars: [environment: "${getDeploymentName(env.BRANCH_NAME)}", app_name: "${app_name}"]
                publishChecks name: "${githubChecks.app_deployment}", detailsURL: "${detailsURL}", status: "${status.completed}", conclusion: "${conclusions.success}"
            } catch(Exception ex) {
                publishChecks name: "${githubChecks.app_deployment}", detailsURL: "${detailsURL}", status: "${status.completed}", conclusion: "${conclusions.failure}"
                error "ERROR. Aborting App Deployment execution. ${e.getMessage()}"
            }
        }
    }
    else {
        sh "echo No project image build and deployment for branch ${env.BRANCH_NAME} is needed."
    }    
}