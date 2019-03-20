#Pass arguments from command line
if [ "$DEPLOYMENT_GROUP_NAME" == "preProdCodeDeploy-Group" ]
then
  cd /preprod_desker_api/
  pm2 reload preProdProcesses.yml
elif [ "$DEPLOYMENT_GROUP_NAME" == "prodCodeDeploy-Group" ] 
then
  cd /production_desker_api/2019-03-20-01/
  pm2 start prodProcesses.yml
  pm2 stop ConsumerZero
  pm2 stop Widget_ConsumerZero
  pm2 stop Log_ConsumerZero
  sleep 2
  cd /production_portal_api/portal/ 
  npm install 
  pm2 start prodPortalProcesses.yml
else    
  echo "Unknown deployment Group"
fi
