import React from "react";
import { Card, CardBody } from "@heroui/card";
import { Button, CardHeader, Link, InputOtp } from "@heroui/react";

export default function VerifyForm({
  code,
  handleSubmit,
  handleSendNewCode,
  error,
  resendMessage,
  timeLeft,
  isDisabled,
  isLoading,
  isRequesting,
  handleChange,
}) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex flex-col items-center justify-center pt-20">
      <Card className="w-[40vw] p-10 mt-5 cursor-pointer">
        <CardHeader className="px-4 pt-2 flex items-center justify-center">
          <img src="/logo.png" width={130} height={150} alt="Logo" />
        </CardHeader>
        <CardBody className="justify-center items-center">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 items-center">
            <div>
              {resendMessage ? "" : "An OTP code has been sent to your Email"}
            </div>

            {resendMessage && (
              <div className="text-md text-success px-2 pb-2">
                {resendMessage}
              </div>
            )}
            <div className="text-yellow-600">The OTP expires in 1 hour</div>
            {error && (
              <div className="text-md text-danger px-2 pb-2">{error}</div>
            )}

            <InputOtp
              length={4}
              value={code} // Usamos el valor del código directamente desde el estado
              onValueChange={handleChange} // Ahora estamos pasando solo el valor directamente
              label="Code"
              placeholder="Enter code"
            />

            <center>
              <Button
                type="submit"
                size="md"
                className="w-48 disabled:cursor-not-allowed"
                color="primary"
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? "Verifying.." : "Verify"}
              </Button>
            </center>
          </form>
        </CardBody>
        <div className="flex justify-center items-center gap-2">
          Don't see code?
          <Link showAnchorIcon className="text-primary">
            {!isDisabled ? (
              <button type="button" onClick={handleSendNewCode}>
                {isRequesting ? "Requesting..." : "Get a new one"}
              </button>
            ) : (
              <div className="cursor-default">
                Request a new one in {minutes}:
                {seconds < 10 ? `0${seconds}` : seconds} min
              </div>
            )}
          </Link>
        </div>
      </Card>
    </div>
  );
}
