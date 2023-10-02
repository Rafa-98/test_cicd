node {
    stage('validate branch name') {
        sh "echo Branch name is: ${env.BRANCH_NAME}"
    }
    stage('decision based on branch name') {
        if(env.BRANCH_NAME.contains("feature")) {
            sh "echo feature branch identified."
        }
        else {
            sh "echo ERROR: unknown branch identified."
        }
    }
}