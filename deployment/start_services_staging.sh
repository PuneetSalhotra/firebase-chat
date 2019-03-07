#Pass arguments from command line
if [ "$DEPLOYMENT_GROUP_NAME" == "codeDeployOnStagingGroup" ]
then
  cd /staging_desker_api/  
  pm2 delete /^Staging_Main/
  pm2 delete /^Staging_Consumer/
  pm2 delete /^Staging_Widget/
  pm2 delete /^Staging_Log/
  pm2 start stagingProcesses.yml
  pm2 stop Staging_ConsumerZero
  pm2 stop Staging_WidgetZero
else    
  echo "Unknown deployment Group"
fi