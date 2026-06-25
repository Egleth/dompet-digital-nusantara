export default function StatusMessage({ searchParams }) {
  if (searchParams?.error) {
    return <div className="status error">{searchParams.error}</div>;
  }

  if (searchParams?.success) {
    return <div className="status success">{searchParams.success}</div>;
  }

  return null;
}
