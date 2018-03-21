

import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.HashMap;

import com.google.gson.Gson;

public class Activity {
	
	public static long createActivity(
			String authToken,
			String title,
			HashMap<String, String> inlineData,
			long idAsset,
			long idOrganization,
			long idAccount,
			long idWorkforce,
			long idActivityType,
			int idActivityTypeCategory,
			String activityStartDatetime,
			String activityEndDatetime,
			long idSubType,
			String nameSubType,
			long idActivityStatus,
			int idAssetRole,
			long channelActivityId,
			int channelActivityCategoryId,
			long parentActivityId
			)
	{
		Long idActivity = (long) 0;
		PreparedStatement ps = null;
		ResultSet rs = null;
		try {
			
			Gson gson = new Gson();
			String dataInline = gson.toJson(inlineData);
			
			String url = "http://api.desker.co/0.1/activity/add";

			URL obj = new URL(url);

			HttpURLConnection httpcon = (HttpURLConnection) obj.openConnection();

			//add reuqest header
			httpcon.setRequestMethod("POST");
			httpcon.setRequestProperty("Accept-Language", "UTF-8");

		//	String urlParameters = "db_host="+DB_HOST+"&db_username="+DB_USERNAME+"&db_password="+DB_PASSWORD+"&insert=1&PATH="+PROC_SAVE_PATH;

			String urlParameters = 
			"organization_id="+idOrganization+
			"&account_id="+idAccount+
			"&workforce_id="+idWorkforce+
			"&asset_id=" +idAsset+
			"&asset_token_auth=" +authToken+
			"&asset_message_counter=0" +
			"&activity_title="+title+
			"&activity_description="+title+
			"&activity_datetime_start="+activityStartDatetime+
			"&activity_datetime_end="+activityEndDatetime+
			"&activity_inline_data="+dataInline+
			"&activity_type_category_id="+idActivityTypeCategory+
			"&activity_type_id="+idActivityType+
			"&activity_access_role_id="+idAssetRole+
			"&activity_parent_id=" +parentActivityId+
			"&flag_pin=0" +
			"&flag_priority=0" +
			"&flag_offline=0" +
			"&flag_retry=0" +
			"&message_unique_id="+Utils.getMessageUniqueId(idAsset)+
			"&track_latitude=0.0" +
			"&track_longitude=0.0" +
			"&track_altitude=0.0" +
			"&track_gps_datetime="+Utils.CurrentDatetimeUTC()+
			"&track_gps_accuracy=0.0" +
			"&track_gps_status=1" +
			"&track_gps_location=" +
			"&service_version=1.0" +
			"&app_version=1.0" +
			"&device_os_id=5" +
			"&product_id=2" +			
			"&activity_sub_type_id="+idSubType+
			"&activity_sub_type_name="+nameSubType+
			"&channel_activity_id="+channelActivityId+
			"&activity_status_id="+idActivityStatus;
			
	
			/**************************************************************/
			
			// Send post request
			httpcon.setDoOutput(true);
			DataOutputStream wr = new DataOutputStream(httpcon.getOutputStream());
			wr.writeBytes(urlParameters);
			wr.flush();
			wr.close();
			//System.out.println(urlParameters);
			int responseCode = httpcon.getResponseCode();
//			System.out.println("\nSending 'POST' request to URL : " + url);
//			System.out.println("Post parameters : " + urlParameters);
//			System.out.println("Response Code : " + responseCode);

			BufferedReader in = new BufferedReader(
			        new InputStreamReader(httpcon.getInputStream()));
			String inputLine;
			StringBuffer response = new StringBuffer();

			while ((inputLine = in.readLine()) != null) {
				response.append(inputLine);
			}
			in.close();			
			
			String str = response.toString();
			//System.out.println(response.toString());
			
			String str1 = str.substring(str.indexOf("response"), str.lastIndexOf(','));
			idActivity = Long.parseLong(str1.substring((str1.lastIndexOf(":")+1), str1.length()));
			//System.out.println(str1);
			//idActivity = Long.parseLong(str.substring((str.lastIndexOf(':')+1), (str.length()-2)));
			
			
		}catch(Exception e)
		{
			e.printStackTrace();
		}
		return idActivity;
	}


}
