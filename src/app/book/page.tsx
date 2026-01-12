import BookingWizard from '@/components/BookingWizard';

export default function BookPage() {
    return (
        <div className="container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '40px' }}>Book Your Visit</h1>
            <BookingWizard />
        </div>
    );
}
