#Pass arguments from command line
if [ "$DEPLOYMENT_GROUP_NAME" == "DeskerApiCode-Staging" ]
then
  cd /api-staging-efs/node/staging_desker_api/
  mode=staging pm2 reload startStagProcesses.yml
elif [ "$DEPLOYMENT_GROUP_NAME" == "DeskerMobileApiPreProdApp-Group" ]
then
  cd /api-staging-efs/node/preprod_desker_api/
  mode=preprod pm2 reload startPreProdProcesses.yml
elif [ "$DEPLOYMENT_GROUP_NAME" == "DeskerApiCode-Production" ] 
then
  cd /api-itsnotan-efs/node/production_desker_api/2018-09-20-01/
  mode=prod pm2 reload startProdProcesses.yml
  sleep 2
  cd /api-final-efs/node/production_portal_api
  mode=prod pm2 reload startAllProdPortalProcesses.yml
else    
  echo "Unknown deployment Group"
fi
