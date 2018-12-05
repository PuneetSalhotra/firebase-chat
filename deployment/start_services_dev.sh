#Pass arguments from command line
if [ "$DEPLOYMENT_GROUP_NAME" == "tempdeploy-Group" ]
then
  cd /staging_desker_api/
  #pm2 delete /^Dev_Consumer/
  #pm2 delete /^Dev_Main/
  #pm2 delete /^Dev_Log/
  #pm2 delete /^Dev_Main/
  #pm2 delete /^Dev_Widget/
  pm2 start devProcesses.yml
else    
  echo "Unknown deployment Group"
fi
