// status: 'connecting' | 'connected' | 'reconnecting'. Shows nothing while everything is fine.
export default function ConnectionBanner({ status }) {
  if (status === 'connected') return null;

  return (
    <div className="banner" role="status">
      {status === 'connecting'
        ? 'Connecting to the server...'
        : 'Connection lost. Trying to reconnect. You can read messages, but sending is paused until you are back online.'}
    </div>
  );
}
