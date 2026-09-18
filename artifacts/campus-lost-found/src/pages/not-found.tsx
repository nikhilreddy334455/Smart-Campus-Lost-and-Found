import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, ArrowLeft, Compass } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="not-found-page">
      <Card className="not-found-card">
        <CardContent className="pt-6">
          <div className="not-found-heading">
            <span className="not-found-mark"><Compass size={21} /></span>
            <span className="eyebrow">Campus wayfinding</span>
          </div>
          <AlertCircle className="not-found-alert" />
          <h1 className="not-found-title">That route took a wrong turn.</h1>
          <p className="not-found-copy">This page isn’t on the campus board. Head back to the overview and find your way from there.</p>
          <Link href="/" className="button-primary not-found-link" data-testid="link-not-found-home"><ArrowLeft size={15} /> Back to overview</Link>
        </CardContent>
      </Card>
    </div>
  );
}
