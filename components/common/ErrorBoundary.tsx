import React, { Component, type ErrorInfo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { captureException as sentryCapture } from '@sentry/react-native';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorKey: number;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false, error: null, errorKey: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    sentryCapture(error, {
      extra: { componentStack: errorInfo.componentStack },
    });
  }

  handleRetry = () => {
    this.setState((prev) => ({ hasError: false, error: null, errorKey: prev.errorKey + 1 }));
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <View style={styles.container}>
          <Text style={styles.title}>出错了</Text>
          <Text style={styles.message}>
            {this.state.error?.message ?? '未知错误'}
          </Text>
          <Button mode="contained" onPress={this.handleRetry} accessibilityLabel="重试">
            重试
          </Button>
        </View>
      );
    }
    return <View key={this.state.errorKey} style={{ flex: 1 }}>{this.props.children}</View>;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 16,
    textAlign: 'center',
  },
});
