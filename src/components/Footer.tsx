
const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="py-6 px-6 border-t border-border mt-auto bg-card text-muted-foreground">
      <div className="container mx-auto text-center text-sm">
        <p>
          &copy; {currentYear} TextTrack. Made by{" "}
          <a
            href="https://imrishmika.site"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-semibold"
          >
            Rishmika Sandanu 👨‍💻
          </a>
          .
        </p>
        <p className="text-xs mt-2">
          Powered by Tesseract.js 🚀 | All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
