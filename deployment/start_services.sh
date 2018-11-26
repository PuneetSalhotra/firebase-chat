#Pass arguments from command line
if [ "$DEPLOYMENT_GROUP_NAME" == "preProdCodeDeploy-Group" ]
then
  cd /preprod_desker_api/
  mode=preprod pm2 reload startPreProdProcesses.yml
elif [ "$DEPLOYMENT_GROUP_NAME" == "prodCodeDeploy-Group" ] 
then
  cd /production_desker_api/2018-11-26-01/
  mode=prod pm2 reload startProdProcesses.yml
  #sleep 2
  #cd /api-final-efs/node/production_portal_api
  #mode=prod pm2 reload startAllProdPortalProcesses.yml
else    
  echo "Unknown deployment Group"
fi
