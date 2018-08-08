#Pass arguments from command line
if [ "$DEPLOYMENT_GROUP_NAME" == "DeskerApiCode-Staging" ]
then
  cd /api-final-efs/node/staging/staging_desker_api
  mode=staging pm2 reload startStagProcesses.yml
elif [ "$DEPLOYMENT_GROUP_NAME" == "DeskerApiCode-Production" ] 
then
  cd /api-final-efs/node/production/desker_api
  mode=prod pm2 reload startProdProcesses.yml
else    
  echo "Unknown deployment Group"
fi
