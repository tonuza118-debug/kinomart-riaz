import React, { ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF8F5] text-[#1F241E] flex flex-col items-center justify-center p-4 text-center">
          <div className="bg-white border border-[#E8E3D9] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-lg space-y-4">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
              <AlertTriangle className="w-7 h-7" />
            </div>
            
            <h2 className="text-lg sm:text-xl font-black text-[#1F241E]">
              দুঃখিত! কিছু সমস্যা হয়েছে।
            </h2>
            
            <p className="text-xs sm:text-sm text-gray-600 font-medium">
              পেজটি লোড করার সময় একটি অপ্রত্যাশিত সমস্যা ঘটেছে। অনুগ্রহ করে পেজটি রিফ্রেশ করুন।
            </p>

            <button
              onClick={this.handleReset}
              className="w-full bg-[#5E6A45] hover:bg-[#485333] active:scale-95 text-white font-extrabold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 animate-spin-once" />
              <span>পেজ রিফ্রেশ করুন</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
