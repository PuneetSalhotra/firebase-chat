#Pass arguments from command line
if [ "$DEPLOYMENT_GROUP_NAME" == "sprintServicesCodeDeploy-dg" ]
then
  cd /sprint_desker_api/
  #We are removing and freshly installing coz aspose java dependency
  rm -rf node_modules
  npm install
  pm2 delete /^Sprint_ConsumerZero/
  pm2 delete /^Sprint_Main/
  pm2 reload sprintProcesses.yml
else    
  echo "Unknown deployment Group"
fi
