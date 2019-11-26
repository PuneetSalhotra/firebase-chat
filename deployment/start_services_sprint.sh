#Pass arguments from command line
if [ "$DEPLOYMENT_GROUP_NAME" == "sprintServicesCodeDeploy-dg" ]
then
  cd /sprint_desker_api/
  pm2 delete /^Sprint_ConsumerZero/
  pm2 delete /^Sprint_Main/
  pm2 reload sprintProcesses.yml
else    
  echo "Unknown deployment Group"
fi
