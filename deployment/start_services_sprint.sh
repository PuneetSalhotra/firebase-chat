#Pass arguments from command line
if [ "$DEPLOYMENT_GROUP_NAME" == "sprintServicesCodeDeploy-dg" ]
then
  cd /sprint_desker_api/
  pm2 delete /^sprint_Consumer/
  pm2 delete /^sprint_Main/
  mode=sprint pm2 reload sprintProcesses.yml
else    
  echo "Unknown deployment Group"
fi
