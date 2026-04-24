import { render } from '@testing-library/react-native';
import { AmountText } from '../components/finance/AmountText';

describe('AmountText', () => {
  it('renders positive amounts', () => {
    const { getByText } = render(<AmountText value={1234.56} />);
    expect(getByText('¥1,234.56')).toBeTruthy();
  });

  it('renders zero', () => {
    const { getByText } = render(<AmountText value={0} />);
    expect(getByText('¥0.00')).toBeTruthy();
  });

  it('handles NaN as zero', () => {
    const { getByText } = render(<AmountText value={NaN} />);
    expect(getByText('¥0.00')).toBeTruthy();
  });

  it('handles null as zero', () => {
    const { getByText } = render(<AmountText value={null} />);
    expect(getByText('¥0.00')).toBeTruthy();
  });

  it('handles string values', () => {
    const { getByText } = render(<AmountText value="99.99" />);
    expect(getByText('¥99.99')).toBeTruthy();
  });

  it('handles negative amounts', () => {
    const { getByText } = render(<AmountText value={-100} />);
    expect(getByText('-¥100.00')).toBeTruthy();
  });
});
