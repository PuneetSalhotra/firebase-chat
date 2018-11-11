#Pass arguments from command line
if [ "$DEPLOYMENT_GROUP_NAME" == "DeskerPamStagingApp-group" ]
then
  cd /api-staging-efs/node/staging_desker_api/
  #Uncommented the following line
  mode=staging pm2 reload startStagProcesses.yml
else    
  echo "Unknown deployment Group"
fi
