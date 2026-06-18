import axios from 'axios';

/**
 * iCarry.in API Client
 *
 * Verified working format (from live API testing 2026-05-15):
 * - Auth: POST /api_login with {username, key} → returns {api_token}
 * - Token: passed as URL query param ?api_token=TOKEN on all subsequent calls
 * - Params: bracket notation for nested objects  e.g. consignee[name], parcel[value]
 * - Booking: POST /api_add_shipment_surface?api_token=TOKEN
 * - Tracking: POST /api_track_shipment?api_token=TOKEN  body: {shipment_id}
 */
export class ICarryClient {
  private username: string;
  private key: string;
  private baseUrl: string;
  private token: string | null = null;
  private tokenExpiry: number = 0;

  constructor(username: string, key: string, baseUrl: string = 'https://www.icarry.in') {
    this.username = username;
    this.key = key;
    this.baseUrl = baseUrl;
  }

  // ─── Auth ─────────────────────────────────────────────────────────────────

  private async getToken(): Promise<string> {
    // Reuse token if valid (tokens last ~60min, we refresh at 55min)
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/api_login`,
        new URLSearchParams({ username: this.username, key: this.key }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      const data = response.data;
      if (data?.api_token) {
        this.token = data.api_token;
        this.tokenExpiry = Date.now() + 55 * 60 * 1000;
        console.log('[iCarry] Token acquired successfully');
        return this.token!;
      }
      throw new Error(data?.error || 'No token in response');
    } catch (error: any) {
      const msg = error.response?.data?.error || error.message;
      console.error('[iCarry] Login failed:', msg);
      throw new Error(`iCarry login failed: ${msg}`);
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /** Convert nested object to bracket-notation flat params for form-urlencoded */
  private flattenToBrackets(obj: any, prefix = ''): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined || v === null) continue;
      const key = prefix ? `${prefix}[${k}]` : k;
      if (typeof v === 'object' && !Array.isArray(v)) {
        Object.assign(result, this.flattenToBrackets(v, key));
      } else {
        result[key] = String(v);
      }
    }
    return result;
  }

  private async post(endpoint: string, body: Record<string, any>) {
    const token = await this.getToken();
    const url = `${this.baseUrl}${endpoint}?api_token=${token}`;
    const flat = this.flattenToBrackets(body);
    const formBody = new URLSearchParams(flat).toString();

    const response = await axios.post(url, formBody, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  public async getEstimate(params: {
    origin_pincode: string;
    destination_pincode: string;
    weight: number;   // grams
    length: number;   // cm
    breadth: number;  // cm
    height: number;   // cm
    shipment_mode?: 'S' | 'A';   // S=Surface, A=Air
    shipment_type?: 'P' | 'C';   // P=Prepaid, C=COD
    shipment_value?: number;
  }) {
    try {
      return await this.post('/api_get_estimate', {
        origin_pincode: params.origin_pincode,
        destination_pincode: params.destination_pincode,
        weight: params.weight,
        length: params.length,
        breadth: params.breadth,
        height: params.height,
        origin_country_code: 'IN',
        destination_country_code: 'IN',
        shipment_mode: params.shipment_mode || 'S',
        shipment_type: params.shipment_type || 'P',
        shipment_value: params.shipment_value ?? 1,
      });
    } catch (error: any) {
      console.error('[iCarry] Estimate error:', error.response?.data || error.message);
      throw error;
    }
  }

  public async bookShipment(params: {
    pickup_address_id: string | number;
    client_order_id: string;
    courier_id?: string | number;   // select a specific iCarry courier (e.g. Xpressbees)
    consignee: {
      name: string;
      mobile: string;
      address: string;
      city: string;
      pincode: string;
      state: string;         // 2-letter state code e.g. 'MH'
      country_code?: string; // defaults to 'IN'
    };
    parcel: {
      type: 'Prepaid' | 'COD';
      value: number;
      contents: string;
    };
    measurements: {
      weight: number;  // grams
      length: number;  // cm
      breadth: number; // cm
      height: number;  // cm
      unit?: string;   // defaults to 'cm'
    };
    mode?: 'surface' | 'air';
  }) {
    const endpoint = params.mode === 'air'
      ? '/api_add_shipment_air'
      : '/api_add_shipment_surface';

    const body: Record<string, any> = {
      pickup_address_id: params.pickup_address_id,
      client_order_id: params.client_order_id,
      consignee: {
        name: params.consignee.name,
        mobile: params.consignee.mobile,
        address: params.consignee.address,
        city: params.consignee.city,
        pincode: params.consignee.pincode,
        state: params.consignee.state,
        country_code: params.consignee.country_code || 'IN',
      },
      parcel: {
        type: params.parcel.type,
        value: params.parcel.value,
        contents: params.parcel.contents.substring(0, 255),
      },
      // Weight + dimensions as FLAT top-level params (the working estimate endpoint
      // uses flat `weight/length/breadth/height`). Without official add_shipment docs
      // we send every common alias so whichever field iCarry reads receives the real
      // value; unknown keys are ignored. This stops iCarry defaulting to 500g.
      weight: params.measurements.weight,
      dead_weight: params.measurements.weight,
      actual_weight: params.measurements.weight,
      package_weight: params.measurements.weight,
      length: params.measurements.length,
      breadth: params.measurements.breadth,
      height: params.measurements.height,
      package_length: params.measurements.length,
      package_breadth: params.measurements.breadth,
      package_height: params.measurements.height,
      // Nested form too, harmlessly, in case a courier reads it.
      measurements: {
        weight: params.measurements.weight,
        length: params.measurements.length,
        breadth: params.measurements.breadth,
        height: params.measurements.height,
        unit: params.measurements.unit || 'cm',
      },
    };

    // Pin the shipment to a specific iCarry courier (e.g. Xpressbees) when provided.
    if (params.courier_id !== undefined && params.courier_id !== null && params.courier_id !== '') {
      body.courier_id = params.courier_id;
    }

    try {
      console.log('[iCarry] add_shipment request:', JSON.stringify(this.flattenToBrackets(body)));
      const data = await this.post(endpoint, body);
      console.log('[iCarry] add_shipment response:', JSON.stringify(data));

      if (data?.shipment_id) {
        return {
          shipment_id: String(data.shipment_id),
          awb: data.awb || null,
          tracking_url: data.tracking_url || `https://www.icarry.in/track-shipment?awb=${data.awb}`,
          courier_name: data.courier_name_full || data.courier_name || null,
          pickup_scheduled: data.success || null,
          cost_estimate: data.cost_estimate || null,
        };
      }

      // If no shipment_id, it's an error
      throw new Error(data?.error || 'Booking failed — no shipment_id in response');
    } catch (error: any) {
      console.error('[iCarry] Booking error:', error.response?.data || error.message);
      throw error;
    }
  }

  public async trackShipment(shipmentId: string) {
    try {
      const data = await this.post('/api_track_shipment', { shipment_id: shipmentId });

      if (!data || data.error || data.success === 0) {
        return { success: false, error: data?.error || 'Tracking failed' };
      }

      return {
        success: true,
        shipment_id: shipmentId,
        awb: data.awb || null,
        current_status: data.status || null,
        location: data.location || null,
        courier_name: data.courier_name || null,
        tracking_url: data.tracking_url || null,
        edd: data.edd || null,
        picked_datetime: data.picked_datetime || null,
        delivered_datetime: data.delivered_datetime || null,
        // iCarry returns "details" array (not milestones)
        milestones: (data.details || []).map((d: any) => ({
          datetime: d.datetime,
          location: d.location,
          notes: d.notes,
        })),
      };
    } catch (error: any) {
      console.error('[iCarry] Tracking error:', error.response?.data || error.message);
      return { success: false, error: error.message };
    }
  }

  public async cancelShipment(shipmentId: string) {
    try {
      const data = await this.post('/api_cancel_shipment', { shipment_id: shipmentId });
      return data;
    } catch (error: any) {
      console.error('[iCarry] Cancel error:', error.response?.data || error.message);
      throw error;
    }
  }

  // ─── State Code Helper ────────────────────────────────────────────────────

  public static getStateCode(stateName: string): string {
    const states: Record<string, string> = {
      'Andaman and Nicobar Islands': 'AN',
      'Andhra Pradesh': 'AP',
      'Arunachal Pradesh': 'AR',
      'Assam': 'AS',
      'Bihar': 'BR',
      'Chandigarh': 'CH',
      'Chhattisgarh': 'CG',
      'Dadra and Nagar Haveli': 'DN',
      'Dadra and Nagar Haveli and Daman and Diu': 'DH',
      'Daman and Diu': 'DD',
      'Delhi': 'DL',
      'Goa': 'GA',
      'Gujarat': 'GJ',
      'Haryana': 'HR',
      'Himachal Pradesh': 'HP',
      'Jammu and Kashmir': 'JK',
      'Jharkhand': 'JH',
      'Karnataka': 'KA',
      'Kerala': 'KL',
      'Ladakh': 'LA',
      'Lakshadweep': 'LD',
      'Madhya Pradesh': 'MP',
      'Maharashtra': 'MH',
      'Manipur': 'MN',
      'Meghalaya': 'ML',
      'Mizoram': 'MZ',
      'Nagaland': 'NL',
      'Odisha': 'OR',
      'Puducherry': 'PY',
      'Punjab': 'PB',
      'Rajasthan': 'RJ',
      'Sikkim': 'SK',
      'Tamil Nadu': 'TN',
      'Telangana': 'TG',
      'Tripura': 'TR',
      'Uttar Pradesh': 'UP',
      'Uttarakhand': 'UK',
      'West Bengal': 'WB',
    };

    const normalized = stateName.trim();
    // Exact match
    if (states[normalized]) return states[normalized];
    // Case-insensitive match
    const found = Object.keys(states).find(
      k => k.toLowerCase() === normalized.toLowerCase()
    );
    if (found) return states[found];
    // Prefix-based abbreviation fallback
    return normalized.substring(0, 2).toUpperCase();
  }
}
