#Pass arguments from command line
if [ "$DEPLOYMENT_GROUP_NAME" == "codeDeployOnStagingGroup" ]
then
  cd /staging_desker_api/
  mode=staging pm2 reload startStagProcesses.yml
else    
  echo "Unknown deployment Group"
fi
