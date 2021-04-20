import { Button } from 'antd';
import React from 'react';
import '../styles/footer.css';

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
      </ul>
    </footer>
  );
}
