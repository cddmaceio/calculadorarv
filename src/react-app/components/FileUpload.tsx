import React, { useRef } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from '@/react-app/components/Button';
import { cn } from '@/react-app/lib/utils';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  accept?: string;
  className?: string;
  uploadedFileName?: string;
  onRemoveFile?: () => void;
  disabled?: boolean;
}

export function FileUpload({ 
  onFileUpload, 
  accept = '.csv,.xlsx,.xls', 
  className,
  uploadedFileName,
  onRemoveFile,
  disabled = false
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  if (uploadedFileName) {
    return (
      <div className={cn("flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg", className)}>
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-800 font-medium">{uploadedFileName}</span>
        </div>
        {onRemoveFile && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemoveFile}
            className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
        disabled={disabled}
      />
      <div
        onClick={handleClick}
        className={cn(
          "flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg",
          disabled 
            ? "border-gray-200 bg-gray-50 cursor-not-allowed" 
            : "border-gray-300 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
        )}
      >
        <Upload className={cn("h-8 w-8 mb-2", disabled ? "text-gray-300" : "text-gray-400")} />
        <p className={cn("text-sm text-center", disabled ? "text-gray-400" : "text-gray-600")}>
          <span className={cn("font-medium", disabled ? "text-gray-400" : "text-blue-600")}>
            {disabled ? "Upload desativado" : "Clique para fazer upload"}
          </span>
          <br />
          {!disabled && "ou arraste o arquivo aqui"}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Formatos aceitos: CSV, Excel
        </p>
      </div>
    </div>
  );
}
