const baseToastStyle = {
  borderRadius: '8px',
  padding: '16px',
  fontWeight: '600',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  border: 'none',
}

export const loadingToastStyle = {
  ...baseToastStyle,
  background: 'white',
  color: 'black',
  spinnerColor: 'white',
}

export const successToastStyle = {
  ...baseToastStyle,
  background: '#4CAF50',
  color: 'white',
}

export const errorToastStyle = {
  ...baseToastStyle,
  background: '#F44336',
  color: 'white',
}

export const infoToastStyle = {
  ...baseToastStyle,
  background: '#2196F3',
  color: 'white',
}
