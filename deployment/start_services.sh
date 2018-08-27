#Pass arguments from command line
if [ "$DEPLOYMENT_GROUP_NAME" == "DeskerApiCode-Staging" ]
then
  cd /api-staging-efs/node/staging_desker_api/
  mode=staging pm2 reload startStagProcesses.yml
elif [ "$DEPLOYMENT_GROUP_NAME" == "DeskerApiCode-Production" ] 
then
  cd /api-itsnotan-efs/node/production_desker_api/2018-08-28-02/
  mode=prod pm2 reload startProdProcesses.yml
else    
  echo "Unknown deployment Group"
fi
