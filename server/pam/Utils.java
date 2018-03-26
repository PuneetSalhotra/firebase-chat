
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.TimeZone;


public class Utils {
	public static final int MILLISECONDS_IN_530_HOURS 	= 19800000;
	public static final int MILLISECONDS_IN_A_DAY 		= 86400000;
	public static final int MILLISECONDS_IN_A_SECOND 	= 1000;
	public static final int SECONDS_IN_530_HOURS 		= 19800;
	public static final int SECONDS_IN_A_MINUTE 		= 60;
	
	public static String CurrentDatetimeUTC()
	{
		SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		formatter.setTimeZone(TimeZone.getTimeZone("UTC"));
		return formatter.format(new Date());
	}
	
	public static String CurrentDatetimeIST()
	{
		SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		formatter.setTimeZone(TimeZone.getTimeZone("IST"));
		return formatter.format(new Date());
	}
	
	public static String UTCToIST(String datetime)
	{
		SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		Calendar calendar = Calendar.getInstance();  
		try
		{		
			Date d2 = formatter.parse(datetime);
			calendar.setTime(d2);			
			//System.out.println(calendar.getTimeInMillis()+MILLISECONDS_IN_530_HOURS);			
			calendar.setTimeInMillis(calendar.getTimeInMillis()+MILLISECONDS_IN_530_HOURS);
			//System.out.println(formatter.format(calendar.getTime())); 
		}
		catch(Exception e)
		{
			e.printStackTrace();
		}
		return formatter.format(calendar.getTime());
	}
	
	public static String getNextDatetime(String datetime)
	{
		SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		Calendar calendar = Calendar.getInstance();  
		try
		{		
			Date d2 = formatter.parse(datetime);
			calendar.setTime(d2);			
			//System.out.println(calendar.getTimeInMillis()+MILLISECONDS_IN_530_HOURS);		
			calendar.setTimeInMillis(calendar.getTimeInMillis() + (MILLISECONDS_IN_A_DAY - 1000));
			//System.out.println(formatter.format(calendar.getTime())); 
		}
		catch(Exception e)
		{
			e.printStackTrace();
		}
		return formatter.format(calendar.getTime());
	}
	
	public static String addOneSecond(String datetime)
	{
		SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		Calendar calendar = Calendar.getInstance();  
		try
		{		
			Date d2 = formatter.parse(datetime);
			calendar.setTime(d2);			
			//System.out.println(calendar.getTimeInMillis()+MILLISECONDS_IN_530_HOURS);		
			calendar.setTimeInMillis(calendar.getTimeInMillis() + MILLISECONDS_IN_A_SECOND);
			//System.out.println(formatter.format(calendar.getTime())); 
		}
		catch(Exception e)
		{
			e.printStackTrace();
		}
		return formatter.format(calendar.getTime());
	}
	
	public static String ISTToUTC(String datetime)
	{
		SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		Calendar calendar = Calendar.getInstance();  
		try
		{		
			Date d2 = formatter.parse(datetime);
			calendar.setTime(d2);			
			//System.out.println(calendar.getTimeInMillis()+MILLISECONDS_IN_530_HOURS);			
			calendar.setTimeInMillis(calendar.getTimeInMillis()-MILLISECONDS_IN_530_HOURS);
			//System.out.println(formatter.format(calendar.getTime())); 
		}
		catch(Exception e)
		{
			e.printStackTrace();
		}
		return formatter.format(calendar.getTime());
	}
	
	public static long diffInHours(String start_datetime, String end_datetime)
	{
		SimpleDateFormat formatter_o;
		//System.out.println("start_datetime "+start_datetime);
		//System.out.println("end_datetime "+end_datetime);
		formatter_o = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		Date d1;
		Date d2;
		long diffHours = 0;
		try
		{
			d1 = formatter_o.parse(start_datetime);
			d2 = formatter_o.parse(end_datetime);
			diffHours = (d2.getTime() - d1.getTime())/ (60 * 60 * 1000);
		} catch (ParseException e) {
			// TODO Auto-generated catch block
			diffHours = -1;
			e.printStackTrace();
		}
		
		return diffHours;
	}
	
	//2016-05-16 to 16-05-2016
	public static String changeFormat(String yyyyMMdd)
	{
		String ddMMyyyy = "";		
		ddMMyyyy = yyyyMMdd.substring(8,10)+"-"+yyyyMMdd.substring(5,7)+"-"+yyyyMMdd.substring(0,4);
		return ddMMyyyy;
	}
	
	@SuppressWarnings("deprecation")
	public static String changeCustomeDateFormat(String datetimeStart)
	{
		String ddMMMyy = "";	
		SimpleDateFormat format1 = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
	    SimpleDateFormat format2 = new SimpleDateFormat("dd MMM yy");
	    Date date;
		try
		{
			date = format1.parse(datetimeStart);
			date.setSeconds(date.getSeconds() + SECONDS_IN_530_HOURS);
		    System.out.println(format2.format(date));
		    ddMMMyy = format2.format(date);
		} catch (ParseException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return ddMMMyy;		
	}
	
	@SuppressWarnings("deprecation")
	public static String changeCustomDateFormat(String datetime)
	{
		String ddMMMyyyy = "";	
		SimpleDateFormat format1 = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
	    SimpleDateFormat format2 = new SimpleDateFormat("dd MMM yyyy");
	    Date date;
		try
		{
			date = format1.parse(datetime);
			date.setSeconds(date.getSeconds() + SECONDS_IN_530_HOURS);
		    System.out.println(format2.format(date));
		    ddMMMyyyy = format2.format(date);
		} catch (ParseException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return ddMMMyyyy;		
	}
	
	@SuppressWarnings("deprecation")
	public static String addMinutes(String datetime, int minutes)
	{
		String result_datetime = "";
		//Calendar calendar = Calendar.getInstance();
		SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
	    Date date;
		try
		{
			date = formatter.parse(datetime);
			date.setSeconds(date.getSeconds() + (SECONDS_IN_A_MINUTE * minutes));
			//System.out.println(formatter.format(date));
			result_datetime = formatter.format(date);
		} catch (ParseException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		return result_datetime;
	}
	
	@SuppressWarnings("deprecation")
	public static String addSeconds(String datetime, int seconds)
	{
		String result_datetime = "";
		//Calendar calendar = Calendar.getInstance();
		SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
	    Date date;
		try
		{
			date = formatter.parse(datetime);
			date.setSeconds(date.getSeconds() + seconds);
		//	System.out.println(formatter.format(date));
			result_datetime = formatter.format(date);
		} catch (ParseException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		return result_datetime;
	}
	
	public static String dateToString(Date datetime)
	{
	    SimpleDateFormat sdf=new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
	    String date_string =sdf.format(datetime);
	   // System.out.println(date_string);
	    return date_string;
	}

	public static Date addSecondsToDate(Date datetime, int seconds)
	{
	    Date date;
		Calendar cal = Calendar.getInstance();
		cal.setTime(datetime);
		cal.add(Calendar.SECOND, seconds);
		date = cal.getTime();
		return date;
	}
	
	public static Calendar DateTime_Current_UTC()
	{
		Calendar calendar = Calendar.getInstance();
		SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		formatter.setTimeZone(TimeZone.getTimeZone("UTC"));
		try
		{		
			//Date date = formatter.parse(formatter.format(new Date()));
			calendar.setTime(formatter.parse(formatter.format(new Date())));
		}catch(Exception e)
		{
			e.printStackTrace();
		}
		return calendar;
	}
	
	public static String getMessageUniqueId(long idAsset)
	{
		int max = 99999999;
		int min = 10000000;
		
	   int randomNumber = (int) Math.round(Math.random() * (max - min + 1) + min);				  			   
	   Long form_transaction_id = Long.parseLong(String.valueOf(idAsset)+(System.currentTimeMillis()/1000));
	   String messageUniqueId = form_transaction_id+""+randomNumber;
	   
	   return messageUniqueId;
	}
}
