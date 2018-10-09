#Pass arguments from command line
if [ "$DEPLOYMENT_GROUP_NAME" == "DeskerApiCode-Staging" ]
then
  cd /api-staging-efs/node/staging_desker_api/
  #mode=staging pm2 reload startStagProcesses.yml
else    
  echo "Unknown deployment Group"
fi