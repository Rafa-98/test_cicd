node {
    stage('validate branch name') {
        sh "echo Branch name is: ${env.BRANCH_NAME}"
        sh "dir"
    }
    stage('code unit tests') {     
        sh 'npm install'
        sh 'npm run test'
    }
    stage('Code Analysis') {
        try {
            def scannerHome = tool 'dev_sonar_scanner'
            withSonarQubeEnv('dev_sonarqube_server') {
            sh "${scannerHome}/bin/sonar-scanner -Dsonar.projectKey=poc-info -Dsonar.login=sqp_9378c6e9eda4a47d391770eb0f15e724607c8e7d"
        }
        } catch(Exception e) {
            sh 'echo ERROR: Ha ocurrido un error durante la ejecución de análisis de código. ${e.getMessage()}'
        }
    }
    stage("Quality Gate") {
        timeout(time: 1, unit: 'HOURS') {
            def qg = waitForQualityGate()
            if (qg.status != 'OK') {
                error "ERROR: Pipeline aborted due to quality gate failure: ${qg.status}"
            }
            else {
                sh 'echo SUCCESS: El proyecto aprobó los criterios mínimos de calidad.'
            }
        }
    }
    stage('decision based on branch name') {
        if(env.BRANCH_NAME.contains("feature")) {
            sh "echo feature branch identified."
        }
        else if(env.BRANCH_NAME == "develop") {
            sh "echo develop branch identified."
            sh "dir"
            sh "echo executing code tests, analysis and deployment"
            try {
                // Image build
                sh 'docker build . -t mendezrafael98/poc-info-jenkins'
                sh 'echo image built'

                // Image publish to Container Registry
                withDockerRegistry([ credentialsId: "rafa_docker_registry_credentials", url: "" ]) {
                    sh 'docker push mendezrafael98/poc-info-jenkins'
                }

                // Container deployment
                ansiblePlaybook credentialsId: 'admin_ssh_access', disableHostKeyChecking: true, installation: 'dev_ansible_server', inventory: '/etc/ansible/hosts', playbook: '/usr/local/ansible/manifests/poc-info-kube-deploy.yaml'    
            } catch(Exception e) {
                error "ERROR. Aborting execution."
            }
        }
        else {
            sh "echo ERROR: unknown branch identified."
        }
    }
}