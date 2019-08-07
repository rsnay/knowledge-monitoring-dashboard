import React, { Component } from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

import compose from '../../compose';

// This constant is simply used to make sure that the same name is always used for the localStorage key
import { AUTH_TOKEN, AUTH_ROLE, AUTH_ROLE_INSTRUCTOR } from '../../constants';

class ResetPassword extends Component {
  constructor(props) {
    super(props);

    this.state = {
      password: '',
      passwordConfirm: '',
      error: '',
      isLoading: false,
      isComplete: false,
    };

    // Pre-bind this function, to make adding it to input fields easier
    this.handleInputChange = this.handleInputChange.bind(this);
  }

  // When the reset password button is pressed, or form is submitted via enter key
  submit(e) {
    if (e) {
      e.preventDefault();
    }
    // Prevent re-submission while loading
    if (this.state.isLoading) {
      return;
    }
    // Clear existing error, and set loading
    this.setState({ error: '', isLoading: true });
    this.resetPassword();
  }

  // Reset password, and log in the instructor
  async resetPassword() {
    // Check that passwords match
    if (this.state.password !== this.state.passwordConfirm) {
      this.setState({ error: 'Passwords do not match.', isLoading: false });
      return;
    }

    // Check for minimum password length (should also be verified on server)
    if (this.state.password.length < 6) {
      this.setState({ error: 'Password must be at least 6 characters', isLoading: false });
      return;
    }

    // Send reset mutation
    const { token } = this.props.match.params;
    const { password } = this.state;
    try {
      const result = await this.props.instructorResetPasswordMutation({
        variables: {
          token,
          password,
        },
      });
      if (result.errors && result.errors.length > 0) {
        throw result;
      }
      // Get token and save it
      const newToken = result.data.instructorResetPassword.token;
      localStorage.setItem(AUTH_TOKEN, newToken);
      localStorage.setItem(AUTH_ROLE, AUTH_ROLE_INSTRUCTOR);
      // Show success message
      this.setState({ isComplete: true });
    } catch (e) {
      let message = 'Please try again later.';
      if (e.errors && e.errors.length > 0) {
        message = e.errors[0].message;
      }
      this.setState({ error: `Error resetting password: ${message}`, isLoading: false });
      console.error(`Error resetting password: ${JSON.stringify(e)}`);
    }
  }

  redirect() {
    // Continue to instructor dashboard, not allowing back navigation
    this.props.history.replace('/instructor/courses');
  }

  // Called when the form fields change
  // This function is from https://reactjs.org/docs/forms.html
  handleInputChange(event) {
    const { target } = event;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const { name } = target;

    this.setState({
      [name]: value,
    });
  }

  // Submit on enter press in password fields
  handleFormKeyPress(event) {
    if (event.key === 'Enter') {
      event.target.blur();
      this.submit();
    }
  }

  render() {
    if (this.state.isComplete) {
      return (
        <article className="container message is-success" style={{ marginTop: '3em' }}>
          <div className="message-header">
            <p>Thanks! Your password has been reset.</p>
            <span className="icon is-large">
              <i className="fas fa-3x fa-check-circle" aria-hidden="true" />
            </span>
          </div>
          <div className="message-body">
            <button onClick={() => this.redirect()} className="button" type="button">
              Continue to Dashboard
            </button>
          </div>
        </article>
      );
    }

    const formCompleted = this.state.passwordConfirm && this.state.password;

    return (
      <section className="section no-select">
        <div className="container">
          <h1 className="title">Reset Password</h1>
          <i>Enter and confirm your new password.</i>
          <form
            className="column is-one-third-desktop is-half-tablet"
            onSubmit={e => this.submit(e)}
          >
            {this.state.error && <p className="notification is-danger">{this.state.error}</p>}

            <div className="field">
              <p className="control has-icons-left">
                <input
                  required
                  value={this.state.password}
                  name="password"
                  onChange={this.handleInputChange}
                  className="input"
                  type="password"
                  placeholder="Password"
                />
                <span className="icon is-small is-left">
                  <i className="fas fa-lock" />
                </span>
              </p>
            </div>

            <div className="field">
              <p className="control has-icons-left">
                <input
                  value={this.state.passwordConfirm}
                  name="passwordConfirm"
                  onChange={this.handleInputChange}
                  className="input"
                  type="password"
                  placeholder="Confirm Password"
                />
                <span className="icon is-small is-left">
                  <i className="fas fa-lock" />
                </span>
              </p>
            </div>

            <div className="field">
              <p className="control">
                <button
                  className={`button is-primary${this.state.isLoading ? ' is-loading' : ''}`}
                  disabled={!formCompleted || this.state.isLoading}
                  onClick={() => this.submit()}
                  type="submit"
                >
                  Reset Password
                </button>
              </p>
            </div>
          </form>
        </div>
      </section>
    );
  }
}

const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPasswordMutation($token: String!, $password: String!) {
    instructorResetPassword(token: $token, password: $password) {
      token
    }
  }
`;

export default compose(
  graphql(RESET_PASSWORD_MUTATION, { name: 'instructorResetPasswordMutation' })
)(ResetPassword);
