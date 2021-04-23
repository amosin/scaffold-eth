import { Button } from 'antd';
import React from 'react';
import '../styles/footer.css';
import transakSDK from '@transak/transak-sdk'


function handleBuyClick() {
  transak.init();
  console.log('Click happened');
}

let transak = new transakSDK({
  apiKey: '925d92ed-b9d7-4eb8-a145-d4878ee65ddb',  // Your API Key (Required)
  environment: 'STAGING', // STAGING/PRODUCTION (Required)
  defaultCryptoCurrency: 'MATIC',
  walletAddress: '', // Your customer wallet address
  themeColor: '000000', // App theme color in hex
  email: '', // Your customer email address (Optional)
  redirectURL: '',
  hostURL: window.location.origin, // Required field
  widgetHeight: '550px',
  widgetWidth: '450px',
  defaultNetwork: 'MATIC',
});


// // To get all the events
// transak.on(transak.ALL_EVENTS, (data) => {
//   console.log(data)
// });

// // This will trigger when the user closed the widget
// transak.on(transak.EVENTS.TRANSAK_WIDGET_CLOSE, (orderData) => {
// transak.close();
// });

// // This will trigger when the user marks payment is made.
// transak.on(transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL, (orderData) => {
// console.log(orderData);
// transak.close();
// });

export default function Footer({ showDrawer }) {
  return (
    <footer className="site-footer">
      <ul className="footer-nav">
        <li>
          <a
            href="https://t.me/Ativo_Finance"
            target="_blank"
            rel="noopener noreferrer"
          >
            Telegram
          </a>
        </li>
        <li>
          <Button type="link" onClick={showDrawer}>
            Help
          </Button>
        </li>
        <li>
          <Button type="link" onClick={() => handleBuyClick()}>
            BUY MATIC
          </Button>
        </li>
      </ul>
    </footer>
  );
}
