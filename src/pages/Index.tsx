
import React, { useState, useCallback } from 'react';
import { createWorker, OEM } from 'tesseract.js';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Copy, Download, Image as ImageIcon, Languages, FileText, Search, AlertTriangle, CheckCircle2, Trash2, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const availableLanguages = [
  { code: 'eng', name: 'English 🇬🇧' },
  { code: 'sin', name: 'Sinhala 🇱🇰' },
  { code: 'fra', name: 'French 🇫🇷' },
  { code: 'deu', name: 'German 🇩🇪' },
  { code: 'spa', name: 'Spanish 🇪🇸' },
  { code: 'hin', name: 'Hindi 🇮🇳' },
  { code: 'jpn', name: 'Japanese 🇯🇵' },
  { code: 'chi_sim', name: 'Chinese (Simplified) 🇨🇳'},
];

const Index = () => {
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [selectedLang, setSelectedLang] = useState<string>('eng');

  const MAX_TOTAL_SIZE_MB = 20;
  const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const files = event.target.files;
      let totalSize = 0;
      for (let i = 0; i < files.length; i++) {
        totalSize += files[i].size;
      }

      if (totalSize > MAX_TOTAL_SIZE_BYTES) {
        toast({
          title: "😥 Upload Limit Exceeded",
          description: `Total file size cannot exceed ${MAX_TOTAL_SIZE_MB}MB. Please select smaller files.`,
          variant: "destructive",
        });
        event.target.value = ""; 
        setSelectedImage(null);
        setImageUrl(null);
        setExtractedText('');
        setProgress(0);
        return;
      }
      
      const firstFile = files[0];
      setSelectedImage(firstFile);
      setImageUrl(URL.createObjectURL(firstFile));
      setExtractedText('');
      setProgress(0); // Reset progress on new image
      toast({ 
        title: "🖼️ Image Ready!",
        description: `Selected: ${firstFile.name}`
      });


      if (files.length > 1) {
        toast({
          title: "ℹ️ Multiple Files Selected", 
          description: "Currently, only the first image will be processed. Batch processing coming soon!",
          variant: "default",
          duration: 5000,
        });
      }
    } else {
      setSelectedImage(null);
      setImageUrl(null);
    }
  };

  const processImage = useCallback(async () => {
    if (!selectedImage) {
      toast({ 
        title: "🖼️ No Image Selected", 
        description: "Please select an image file to process.", 
        variant: "destructive" 
      });
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setExtractedText('');

    const worker = await createWorker(selectedLang, OEM.LSTM_ONLY, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          setProgress(Math.floor(m.progress * 100));
        }
        console.log(m);
      },
    });
    
    try {
      toast({ 
        title: "⚙️ Processing Image...", 
        description: "This might take a moment. Please wait.", 
        duration: 4000
      });
      const { data: { text } } = await worker.recognize(selectedImage);
      setExtractedText(text || "No text found in the image. 🙁");
      toast({ 
        title: "✅ Text Extracted Successfully!", 
        description: text ? "Scroll down to see the results." : "No text was found in the provided image.",
        variant: "default"
      });
    } catch (error) {
      console.error("OCR Error:", error);
      toast({ 
        title: "😢 OCR Failed", 
        description: "Could not extract text. Try another image or language.", 
        variant: "destructive" 
      });
      setExtractedText('Error extracting text. Please try again. 💔');
    } finally {
      await worker.terminate();
      setIsLoading(false);
      setProgress(100); 
    }
  }, [selectedImage, selectedLang, toast]);

  const handleCopyToClipboard = () => {
    if (!extractedText || extractedText === 'Error extracting text. Please try again. 💔' || extractedText === "No text found in the image. 🙁") {
      toast({ 
        title: "✍️ No Text to Copy", 
        description: "Extract text from an image first.", 
        variant: "destructive" 
      });
      return;
    }
    navigator.clipboard.writeText(extractedText)
      .then(() => toast({ 
        title: "📋 Copied to Clipboard!" 
      }))
      .catch(() => toast({ 
        title: "❌ Copy Failed", 
        description: "Could not copy text to clipboard.", 
        variant: "destructive" 
      }));
  };

  const handleDownloadText = () => {
    if (!extractedText || extractedText === 'Error extracting text. Please try again. 💔' || extractedText === "No text found in the image. 🙁") {
      toast({ 
        title: "✍️ No Text to Download", 
        description: "Extract text from an image first.", 
        variant: "destructive" 
      });
      return;
    }
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedImage?.name.split('.')[0]}_extracted.txt` || 'extracted_text.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ 
      title: "💾 Text Downloaded!" 
    });
  };

  const handleClearAll = () => {
    setSelectedImage(null);
    setImageUrl(null);
    setExtractedText('');
    setProgress(0);
    const fileInput = document.getElementById('image-upload') as HTMLInputElement | null;
    if (fileInput) {
      fileInput.value = ""; 
    }
    toast({ 
      title: "🧹 All Cleared!", 
      description: "Inputs and results have been reset." 
    });
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-full space-y-6 p-4 sm:p-6 md:p-8">
      <Card className="w-full max-w-3xl shadow-2xl rounded-xl bg-card text-card-foreground border-border">
        <CardHeader className="p-6 md:p-8 text-center">
          <div className="flex items-center justify-center mb-3">
            <FileText className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl md:text-4xl font-bold text-primary">
            📸 TextTrack: Image to Text ✨
          </CardTitle>
          <CardDescription className="text-sm md:text-base mt-2 px-2 text-muted-foreground">
            Upload image(s) (up to {MAX_TOTAL_SIZE_MB}MB total). We'll extract text from the first one. Supports various languages! 🌍
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-2">
              <Label htmlFor="language-select" className="flex items-center text-sm font-medium"><Languages className="mr-2 h-5 w-5 text-primary" />🗣️ Select Language:</Label>
              <Select value={selectedLang} onValueChange={setSelectedLang}>
                <SelectTrigger id="language-select" className="w-full text-base py-3">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {availableLanguages.map(lang => (
                    <SelectItem key={lang.code} value={lang.code} className="text-base py-2">{lang.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image-upload" className="flex items-center text-sm font-medium"><ImageIcon className="mr-2 h-5 w-5 text-primary" />🖼️ Upload Image(s):</Label>
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer text-base h-12"
              />
            </div>
          </div>
          
          {selectedImage && (
            <div className="flex justify-end mt-2">
              <Button onClick={handleClearAll} variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Clear Current
              </Button>
            </div>
          )}


          {imageUrl && (
            <div className="mt-4 border-2 border-primary/20 dark:border-primary/40 rounded-lg overflow-hidden shadow-lg bg-muted/20 dark:bg-background p-3">
              <p className="text-xs text-muted-foreground mb-2 text-center font-medium">🖼️ Image Preview (First Selected):</p>
              <img src={imageUrl} alt="Selected preview" className="w-full h-auto max-h-[25rem] object-contain rounded-md" />
            </div>
          )}
          
          {selectedImage && (
             <Button onClick={processImage} disabled={isLoading} size="lg" className="w-full text-lg mt-6 h-14">
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-3"></div>
                  Processing Image...⚙️
                </>
              ) : (
                <>
                  <Search className="mr-2 h-6 w-6" /> Extract Text 🔍
                </>
              )}
            </Button>
          )}


          {isLoading && progress > 0 && progress < 100 && (
            <div className="space-y-2 pt-4">
              <Label className="text-base font-medium text-center block text-muted-foreground">⚙️ Processing Progress:</Label>
              <Progress value={progress} className="w-full h-3 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-purple-600 dark:[&>div]:from-blue-400 dark:[&>div]:to-purple-500" />
              <p className="text-sm text-muted-foreground text-center">{progress}% complete</p>
            </div>
          )}

          {extractedText && !isLoading && (
            <div className="space-y-4 pt-6 border-t border-border mt-6">
              <Label htmlFor="extracted-text" className="text-xl font-semibold flex items-center text-primary"><FileText className="mr-2 h-7 w-7"/>📝 Extracted Text:</Label>
              <Textarea
                id="extracted-text"
                value={extractedText}
                readOnly
                rows={12}
                className="bg-muted/30 dark:bg-slate-900/60 border-primary/20 dark:border-primary/40 focus:ring-primary text-base p-4 rounded-md min-h-[200px] shadow-inner"
                placeholder={extractedText.startsWith('Error') || extractedText.startsWith('No text found') ? extractedText : 'Your extracted text will appear here...'}
              />
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
                <Button onClick={handleCopyToClipboard} variant="outline" size="lg" className="flex-1 h-12">
                  <Copy className="mr-2 h-5 w-5" /> Copy Text 📋
                </Button>
                <Button onClick={handleDownloadText} variant="outline" size="lg" className="flex-1 h-12">
                  <Download className="mr-2 h-5 w-5" /> Download .txt 💾
                </Button>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="p-6 md:p-8 border-t border-border">
          <p className="text-xs text-muted-foreground text-center w-full">
            💡 Tip: For best results, use clear images with good contrast. Processing time may vary.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Index;
