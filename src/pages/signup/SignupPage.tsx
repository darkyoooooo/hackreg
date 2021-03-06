import { withFormik, FormikProps } from 'formik';
import React, { useEffect, FC } from 'react';
import Alert from 'react-bootstrap/Alert';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import MemberInfo from './MemberInfo';
import './SignupPage.css';
import { connect } from 'react-redux';
import { StateType } from '../../redux/Store';
import { signupFormValidationSchema } from '../../shared/ValidationSchema';
import { ThunkDispatch } from 'redux-thunk';
import { Action } from 'redux';
import {
  createSignupFormFetchAction,
  createSignupFormUpdateAction
} from '../../redux/action/connective.action';
import LoginAlert from './LoginAlert';
import ConfirmSignupCheckbox from './ConfirmSignupCheckbox';
import TeamInfoContent from './TeamInfoContent';
import SubmitButton from './SubmitButton';
import LoadingSpinnerContent from './LoadingSpinnerContent';
import { SignupFormData } from '../../redux/type/signupForm.type';
import fetch from 'cross-fetch';
import FormGroup from 'react-bootstrap/FormGroup';

type StateProps = { loggedIn: boolean } & StateType['signupForm'];

type DispatchProps = {
  submitFetchAction: () => void;
  submitUpdateAction: (values: SignupFormData) => void;
  reset: () => void;
  setOneAsCaptain: (index: number) => void;
  removeOne: (index: number) => void;
  addMember: (isCaptain: boolean) => void;
};

type Props = FormikProps<SignupFormData> & DispatchProps & StateProps;

const SignupPageContent: FC<Props> = props => {
  const {
    loggedIn,
    submitFetchAction,
    fetchStatus,
    updateStatus,
    handleSubmit,
    reset
  } = props;
  useEffect(() => {
    if (loggedIn) {
      submitFetchAction();
    } else {
      reset();
    }
  }, [loggedIn, submitFetchAction, reset]);
  if (!loggedIn) {
    return <LoginAlert />;
  }
  if (fetchStatus.type === 'CONNECTING' || fetchStatus.type === 'ERRORED') {
    return (
      <LoadingSpinnerContent
        errorMsg={fetchStatus.type === 'ERRORED' ? fetchStatus.message : null}
      />
    );
  }
  return (
    <Container
      fluid={true}
      className="signup-page-container content-fit-viewport"
      as={Form}
      onSubmit={handleSubmit}
    >
      <Row>
        <Col>
          <Alert variant="info" className="signup-alert">
            {/* TODO: fill the date here ;) */}
            报名时间：XXX，请各参赛队伍在XXX之前保存表格并确认报名，否则报名无效。
          </Alert>
        </Col>
      </Row>
      <Row>
        <Col sm={4} as={Container} fluid={true}>
          <Row>
            <Col>
              <h4>确认与提交</h4>
              <ConfirmSignupCheckbox
                submitting={updateStatus.type === 'CONNECTING'}
                {...props}
              />
              <FormGroup>
                <SubmitButton
                  submitting={updateStatus.type === 'CONNECTING'}
                  message={
                    updateStatus.type === 'ERRORED'
                      ? updateStatus.message
                      : updateStatus.type === 'SUCCESS'
                      ? '提交成功'
                      : null
                  }
                />
                <Form.Text className="text-muted font-weight-light">
                  可以多次提交表单来更新信息。
                </Form.Text>
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col>
              <TeamInfoContent
                submitting={updateStatus.type === 'CONNECTING'}
                {...props}
              />
            </Col>
          </Row>
        </Col>
        <Col sm={8}>
          <MemberInfo
            submitting={updateStatus.type === 'CONNECTING'}
            {...props}
          />
        </Col>
      </Row>
    </Container>
  );
};

const mapStateToProps = (state: StateType): StateProps => ({
  ...state.signupForm,
  loggedIn: !!state.localData.email
});

const mapDispatchToProps = (
  dispatch: ThunkDispatch<StateType, {}, Action>
): DispatchProps => ({
  submitFetchAction: () =>
    dispatch(
      createSignupFormFetchAction(
        () =>
          fetch('/backend/signup/fetch', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              Accept: 'application/json'
            },
            mode: 'same-origin',
            credentials: 'same-origin'
          }),
        null
      )
    ),
  submitUpdateAction: (values: SignupFormData) =>
    dispatch(
      createSignupFormUpdateAction(
        () =>
          fetch('/backend/signup/update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              Accept: 'application/json'
            },
            mode: 'same-origin',
            credentials: 'same-origin',
            body: JSON.stringify(values)
          }),
        values
      )
    ),
  reset: () => {
    dispatch({
      type: 'SIGNUP_FORM_FETCH_RESET'
    });
    dispatch({
      type: 'SIGNUP_FORM_UPDATE_RESET'
    });
  },
  setOneAsCaptain: (index: number) =>
    dispatch({ type: 'SIGNUP_FORM_UPDATE_SET_CAPTAIN', index }),
  removeOne: (index: number) =>
    dispatch({
      type: 'SIGNUP_FORM_UPDATE_REMOVE_MEMBER',
      index
    }),
  addMember: (isCaptain: boolean) =>
    dispatch({
      type: 'SIGNUP_FORM_UPDATE_ADD_MEMBER',
      isCaptain
    })
});

const signupPageWithFormik = withFormik<
  StateProps & DispatchProps,
  SignupFormData
>({
  enableReinitialize: true,
  validationSchema: signupFormValidationSchema,
  mapPropsToValues: ({ data }) => ({
    ...(data ?? {
      confirmed: false,
      form: {
        teamInfo: {
          name: '',
          description: ''
        },
        memberInfo: []
      }
    })
  }),
  handleSubmit: (values, { props }) => {
    props.submitUpdateAction(values);
  }
})(SignupPageContent);

const SignupPage = connect(
  mapStateToProps,
  mapDispatchToProps
)(signupPageWithFormik);

export default SignupPage;
