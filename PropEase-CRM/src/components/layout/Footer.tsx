export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-slate-900 to-slate-800 border-t border-slate-700 py-6 px-8">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-3">
          <span className="text-slate-300">© 2024 PropEase CRM. All rights reserved.</span>
        </div>
        <div className="flex items-center space-x-6">
          <a href="#" className="text-slate-300 hover:text-white transition-colors duration-300">Privacy Policy</a>
          <a href="#" className="text-slate-300 hover:text-white transition-colors duration-300">Terms of Service</a>
          <a href="#" className="text-slate-300 hover:text-white transition-colors duration-300">Support</a>
        </div>
      </div>
    </footer>
  );
}
