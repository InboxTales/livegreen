import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

// PostgreSQL (Supabase) is the only supported database
const isPostgres = !!process.env.DATABASE_URL;

let pgPool: pg.Pool | null = null;

if (isPostgres) {
  console.log("Using PostgreSQL (Supabase)");
  pgPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000, // 10s timeout
  });
} else {
  console.warn("NO DATABASE_URL FOUND! Database operations will fail.");
}

export const db = {
  isPostgres: true,
  isSQLite: false,
  async query(sql: string, params?: any[]): Promise<any> {
    if (!pgPool) {
      throw new Error("Database not initialized. DATABASE_URL is missing.");
    }

    // Postgres uses $1, $2 instead of ?
    let pgSql = sql;
    if (params && params.length > 0) {
      let count = 0;
      pgSql = sql.replace(/\?/g, () => {
        count++;
        return `$${count}`;
      });
    }
    
    // Basic translation for common v4 migration issues
    pgSql = pgSql
      .replace(/INSERT IGNORE/g, "INSERT") 
      .replace(/INSERT OR IGNORE/g, "INSERT")
      .replace(/INT AUTO_INCREMENT/g, "SERIAL")
      .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, "SERIAL PRIMARY KEY");

    // Handle insertId for Postgres
    const isInsert = pgSql.trim().toUpperCase().startsWith("INSERT");
    if (isInsert && !pgSql.toUpperCase().includes("RETURNING")) {
      pgSql += " RETURNING id";
    }

    try {
      const result = await pgPool.query(pgSql, params);
      
      // Map results to match expected casing and handle BigInts
      const rows = result.rows.map(row => {
        const newRow: any = {};
        for (const key in row) {
          let val = row[key];
          if (typeof val === 'string' && /^\d+$/.test(val) && val.length < 15) {
            val = Number(val);
          }
          
          let newKey = key;
          const mappings: any = {
            'passwordhash': 'passwordHash',
            'customername': 'customerName',
            'totalamount': 'totalAmount',
            'paymentmethod': 'paymentMethod',
            'paymentid': 'paymentId',
            'originalprice': 'originalPrice',
            'seotitle': 'seoTitle',
            'seodescription': 'seoDescription',
            'seokeywords': 'seoKeywords',
            'key_name': 'key_name',
            'key_value': 'key_value',
            
            // customers table
            'totalspent': 'totalSpent',
            'orderscount': 'ordersCount',
            'joindate': 'joinDate',
            
            // promo_codes table
            'discounttype': 'discountType',
            'discountvalue': 'discountValue',
            'minspend': 'minSpend',
            'expirydate': 'expiryDate',
            
            // referrals table
            'referreremail': 'referrerEmail',
            'referredemail': 'referredEmail',
            'rewardcode': 'rewardCode',
            
            // subscriptions table
            'orderid': 'orderId',
            'nextbillingdate': 'nextBillingDate',
            
            // orders table
            'promocodeid': 'promoCodeId',

            // google_reviews table
            'reviewername': 'reviewerName',
            'reviewtext': 'reviewText',
            'reviewdate': 'reviewDate',
            'profilephoto': 'profilePhoto',
            'isvisible': 'isVisible'
          };
          if (mappings[key]) newKey = mappings[key];
          newRow[newKey] = val;
        }
        return newRow;
      });

      if (sql.trim().toUpperCase().startsWith("SELECT") || sql.trim().toUpperCase().startsWith("SHOW")) {
        return [rows, result.fields];
      } else {
        return [{ insertId: (rows[0] as any)?.id || null, affectedRows: result.rowCount }];
      }
    } catch (err: any) {
      console.error("Postgres Query Error:", err.message, "SQL:", pgSql.substring(0, 100));
      throw err;
    }
  },

  async getConnection(): Promise<any> {
    if (!pgPool) throw new Error("Database not initialized");
    
    const client = await pgPool.connect();

    // Apply the same SQL translation as pool.query() but using the dedicated client
    const clientQuery = async (sql: string, params?: any[]): Promise<any> => {
      let pgSql = sql;
      if (params && params.length > 0) {
        let count = 0;
        pgSql = sql.replace(/\?/g, () => {
          count++;
          return `$${count}`;
        });
      }
      pgSql = pgSql
        .replace(/INSERT IGNORE/g, 'INSERT')
        .replace(/INSERT OR IGNORE/g, 'INSERT')
        .replace(/INT AUTO_INCREMENT/g, 'SERIAL')
        .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, 'SERIAL PRIMARY KEY');

      const isInsert = pgSql.trim().toUpperCase().startsWith('INSERT');
      if (isInsert && !pgSql.toUpperCase().includes('RETURNING')) {
        pgSql += ' RETURNING id';
      }

      try {
        const result = await client.query(pgSql, params);
        const rows = result.rows.map((row: any) => {
          const newRow: any = {};
          for (const key in row) {
            let val = row[key];
            if (typeof val === 'string' && /^\d+$/.test(val) && val.length < 15) {
              val = Number(val);
            }
            const mappings: any = {
              passwordhash: 'passwordHash',
              customername: 'customerName',
              totalamount: 'totalAmount',
              paymentmethod: 'paymentMethod',
              paymentid: 'paymentId',
              originalprice: 'originalPrice',
              seotitle: 'seoTitle',
              seodescription: 'seoDescription',
              seokeywords: 'seoKeywords',
              key_name: 'key_name',
              key_value: 'key_value',
              totalspent: 'totalSpent',
              orderscount: 'ordersCount',
              joindate: 'joinDate',
              discounttype: 'discountType',
              discountvalue: 'discountValue',
              minspend: 'minSpend',
              expirydate: 'expiryDate',
              referreremail: 'referrerEmail',
              referredemail: 'referredEmail',
              rewardcode: 'rewardCode',
              orderid: 'orderId',
              nextbillingdate: 'nextBillingDate',
              promocodeid: 'promoCodeId',
              reviewername: 'reviewerName',
              reviewtext: 'reviewText',
              reviewdate: 'reviewDate',
              profilephoto: 'profilePhoto',
              isvisible: 'isVisible'
            };
            newRow[mappings[key] ?? key] = val;
          }
          return newRow;
        });

        if (sql.trim().toUpperCase().startsWith('SELECT') || sql.trim().toUpperCase().startsWith('SHOW')) {
          return [rows, result.fields];
        } else {
          return [{ insertId: (rows[0] as any)?.id || null, affectedRows: result.rowCount }];
        }
      } catch (err: any) {
        console.error('Postgres Client Query Error:', err.message, 'SQL:', pgSql.substring(0, 100));
        throw err;
      }
    };

    return {
      query: clientQuery,
      beginTransaction: async () => client.query('BEGIN'),
      commit: async () => client.query('COMMIT'),
      rollback: async () => client.query('ROLLBACK'),
      release: () => client.release(),
    };
  }
};
;
