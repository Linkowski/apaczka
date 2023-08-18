import crypto from 'node:crypto';

export class ApaczkaApi {
  private static readonly API_URL = 'https://www.apaczka.pl/api/v2/';
  private static readonly SIGN_ALGORITHM = 'sha256';

  constructor(private readonly appID: string, private readonly appSecret: string) {}

  private getSignature(string: string, key: string) {
    return crypto.createHmac(ApaczkaApi.SIGN_ALGORITHM, key).update(string).digest('hex');
  }

  private stringToSign(appId: string, route: string, data: string, expires: number) {
    return `${appId}:${route}:${data}:${expires}`;
  }

  private buildRequest(route: string, data: Record<string, unknown> | null = null) {
    const jsonData = JSON.stringify(data);
    const expires = Math.floor(Date.now() / 1000) + (30 * 60);
    const signature = this.getSignature(
      this.stringToSign(this.appID, route, jsonData, expires),
      this.appSecret,
    );

    return `app_id=${this.appID}&request=${jsonData}&expires=${expires}&signature=${signature}`;
  }

  private async sendRequest(route: string, data: Record<string, unknown> | null = null) {
    const request = this.buildRequest(route, data);

    try {
      const response = await fetch(`${ApaczkaApi.API_URL}${route}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: request,
      });

      if (!response.ok) {
        throw new Error('Request failed');
      }

      return response.text();
    } catch (error) {
      console.error('Request error:', error);
      return null;
    }
  }

  public order(id: string): Promise<unknown> {
    return this.sendRequest(`order/${id}/`);
  }

  public orders(page = 1, limit = 10): Promise<unknown> {
    return this.sendRequest(`orders/`, { page: page, limit: limit });
  }

  public waybill(id: string): Promise<unknown> {
    return this.sendRequest(`waybill/${id}/`);
  }

  public pickupHours(postalCode: string, serviceId: string | null = null): Promise<unknown> {
    return this.sendRequest(`pickup_hours/`, { postal_code: postalCode, service_id: serviceId });
  }

  public orderValuation(order: Record<string, unknown>): Promise<unknown> {
    return this.sendRequest(`order_valuation/`, { order: order });
  }

  public orderSend(order: Record<string, unknown>): Promise<unknown> {
    return this.sendRequest(`order_send/`, { order: order });
  }

  public cancelOrder(id: string): Promise<unknown> {
    return this.sendRequest(`cancel_order/${id}/`);
  }

  public serviceStructure(): Promise<unknown> {
    return this.sendRequest(`service_structure/`);
  }

  public points(type: string | null = null): Promise<unknown> {
    return this.sendRequest(`points/${type}/`);
  }

  public customerRegister(customer: Record<string, unknown>): Promise<unknown> {
    return this.sendRequest(`customer_register/`, { customer: customer });
  }

  public turnIn(orderIds: string[]): Promise<unknown> {
    return this.sendRequest(`turn_in/`, { order_ids: orderIds });
  }
}
