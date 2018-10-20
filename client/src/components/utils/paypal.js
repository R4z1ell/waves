import React, { Component } from 'react';
import PaypalExpressBtn from 'react-paypal-express-checkout';

class Paypal extends Component {
  render() {
    const onSuccess = payment => {
      //console.log(JSON.stringify(payment));
      this.props.onSuccess(payment);

      // {
      //     "paid":true,
      //     "cancelled":false,
      //     "payerID":"8Q87PPFM6QG4S",
      //     "paymentID":"PAY-5NL21616B7472384CLPEOV5I",
      //     "paymentToken":"EC-39F0136689264063L",
      //     "returnUrl":"https://www.sandbox.paypal.com/?paymentId=PAY-5NL21616B7472384CLPEOV5I&token=EC-39F0136689264063L&PayerID=8Q87PPFM6QG4S",
      //     "address":{
      //         "recipient_name":"test buyer",
      //         "line1":"Via Unit? d'Italia, 5783296",
      //         "city":"Napoli",
      //         "state":"Napoli",
      //         "postal_code":"80127",
      //         "country_code":"IT"
      //     },
      //     "email":"gokutra4-buyer@gmail.com"
      // }
    };

    const onCancel = data => {
      console.log(JSON.stringify(data));
    };

    const onError = error => {
      console.log(JSON.stringify(error));
    };

    let env = 'sandbox';
    let currency = 'USD';
    let total = this.props.toPay;

    const client = {
      sandbox:
        'AZLjRU49UPdp-zVOCc3m9aJ8-BW09yWwG04Lyxwca3DAp9UKEu5RO1wUNv1owJ_K2YVu1bxp2-ddiwiN',
      production: ''
    };

    return (
      <div>
        <PaypalExpressBtn
          env={env}
          client={client}
          currency={currency}
          total={total}
          onError={onError}
          onSuccess={onSuccess}
          onCancel={onCancel}
          style={{
            size: 'large',
            color: 'blue',
            shape: 'rect',
            label: 'checkout'
          }}
        />
      </div>
    );
  }
}

export default Paypal;
