

import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;

import com.google.gson.Gson;

public class AssignParticipant {

	public static void assignParticipant(long idOrganization, long idAccount,
			long idWorkforce, long idAsset, long idActivity, String authtoken,
			long idActivityType, int idActivityTypeCategory, int idAssetRole,
			HashMap<String, String> participantCollection, String quantity_unit_type, int quantity_unit_value) {
		try {

			Gson gson = new Gson();

			String collection = gson.toJson(participantCollection);

			String url = "https://api.desker.co/0.1/activity/participant/access/set";

			URL obj = new URL(url);

			HttpURLConnection httpcon = (HttpURLConnection) obj
					.openConnection();

			// add reuqest header
			httpcon.setRequestMethod("POST");
			httpcon.setRequestProperty("Accept-Language", "UTF-8");

			String parameters =

			"product_id=2" + "&organization_id=" + idOrganization
					+ "&account_id=" + idAccount + "&workforce_id="
					+ idWorkforce + "&asset_id=" + idAsset
					+ "&asset_token_auth=" + authtoken
					+ "&asset_message_counter=0" + "&activity_id=" + idActivity
					+ "&activity_access_role_id=" + idAssetRole
					+ "&activity_type_category_id=" + idActivityTypeCategory
					+ "&activity_type_id=" + idActivityType
					+ "&activity_participant_collection=[" + collection + "]"
					+ "&message_unique_id=" + Utils.getMessageUniqueId(idAsset)
					+ "&flag_offline=0" + "&flag_retry=0"
					+ "&track_latitude=0.0" + "&track_longitude=0.0"
					+ "&track_gps_location=" + "&track_gps_datetime="
					+ Utils.CurrentDatetimeUTC() + "&track_gps_accuracy=0.0"
					+ "&track_gps_status=1" + "&device_os_id=5"
					+ "&service_version=1.0" + "&app_version=1.0"
					+ "&api_version=1.0" + "&quantity_unit_type="+quantity_unit_type
					+ "&quantity_unit_value="+quantity_unit_value;

			
			//System.out.println(parameters);
			// Send post request
			httpcon.setDoOutput(true);
			DataOutputStream wr = new DataOutputStream(
					httpcon.getOutputStream());
			wr.writeBytes(parameters);
			wr.flush();
			wr.close();

			int responseCode = httpcon.getResponseCode();
			// System.out.println("\nSending 'POST' request to URL : " + url);
			// System.out.println("Post parameters : " + urlParameters);
			// System.out.println("Response Code : " + responseCode);

			BufferedReader in = new BufferedReader(new InputStreamReader(
					httpcon.getInputStream()));
			String inputLine;
			StringBuffer response = new StringBuffer();

			while ((inputLine = in.readLine()) != null) {
				response.append(inputLine);
			}
			in.close();

			//String str = response.toString();
			//System.out.println(response.toString());
			
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

}
