#Pass arguments from command line
if [ "$DEPLOYMENT_GROUP_NAME" == "codeDeployOnStagingGroup" ]
then
  cd /staging_desker_api/
  pm2 delete /^Staging_Consumer/
  pm2 delete /^Staging_Main/
  pm2 start stagingProcesses.yml
else    
  echo "Unknown deployment Group"
fi
