import SurveyResponsePageClient from "./SurveyResponsePageClient";

// Generate static params for static export
export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
    { id: '4' },
    { id: '5' }
  ];
}

export default function SurveyResponsePage() {
  return <SurveyResponsePageClient />;
}