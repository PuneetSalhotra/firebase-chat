
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;


public class DBConnection {
	
	private static String DB_DRIVER = "com.mysql.jdbc.Driver";
	private static String DB_USERNAME = "sravan";
	private static String DB_PASSWORD = "sravandbaccess2";
//	private static String DB_USERNAME = "root";
//	private static String DB_PASSWORD = "";

	
	private static String DB_URL_SLAVE1 = ""; //slave1
	private static String DB_URL_SLAVE2 = "jdbc:mysql://readreplica2.csmsubzv5xa0.us-east-1.rds.amazonaws.com:3306/";
	private static String DB_URL_MASTER = "jdbc:mysql://deskermysql.citeodhwc7z9.us-east-1.rds.amazonaws.com:3306/desker";
	
//	private static String DB_URL_SLAVE1 = "jdbc:mysql://72.55.144.122:3306/blueflock"; //slave1
//	private static String DB_URL_SLAVE2 = "jdbc:mysql://10.6.102.21:3306/blueflock";
//	private static String DB_URL_MASTER = "jdbc:mysql://72.55.144.120:3306/blueflock";

//	private static String DB_URL_SLAVE1 = "jdbc:mysql://192.168.0.241:3306/blueflock"; //slave1
//	private static String DB_URL_SLAVE2 = "jdbc:mysql://192.168.0.241:3306/blueflock";
//	private static String DB_URL_MASTER = "jdbc:mysql://192.168.0.241:3306/blueflock";
	
//	private static String DB_URL_SLAVE1 = "jdbc:mysql://192.168.0.245:3306/blueflock"; //slave1
//	private static String DB_URL_SLAVE2 = "jdbc:mysql://192.168.0.245:3306/blueflock";
//	private static String DB_URL_MASTER = "jdbc:mysql://192.168.0.245:3306/blueflock";


	DBConnection()
	{
		
	}
	public Connection getMasterConnection()
	{
		Connection con = null;
		try
		{    		
    		Class.forName(DB_DRIVER);
            con = DriverManager.getConnection(DB_URL_MASTER, DB_USERNAME, DB_PASSWORD);
						
		}catch (ClassNotFoundException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}catch (SQLException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		return con;

	}
	
	
	public Connection getSlave1Connection()
	{
		Connection con = null;
		try
		{  		
    		Class.forName(DB_DRIVER);
            con = DriverManager.getConnection(DB_URL_SLAVE1, DB_USERNAME, DB_PASSWORD);
						
		}catch (ClassNotFoundException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}catch (SQLException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		return con;

	}
	
	public Connection getSlave2Connection()
	{
		Connection con = null;
		try
		{  		
    		Class.forName(DB_DRIVER);
            con = DriverManager.getConnection(DB_URL_SLAVE2, DB_USERNAME, DB_PASSWORD);
						
		}catch (ClassNotFoundException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}catch (SQLException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		return con;

	}
	
	public void closeConnection(Connection con)
	{
		try {
			if(con != null)
			{
				if(!con.isClosed())
				{
					con.close();
					//System.out.println("DB Connection Closed");
				}
			}else
			{
				//System.out.println("Connection Object is already null");
			}
		} catch (SQLException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
	

}
